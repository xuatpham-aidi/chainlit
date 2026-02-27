import os
from typing import Any, Literal, Optional, Tuple, cast

from fastapi import Request, Response
from fastapi.exceptions import HTTPException
from fastapi.openapi.models import OAuth2 as OAuth2Model, OAuthFlows as OAuthFlowsModel
from fastapi.security.base import SecurityBase
from fastapi.security.utils import get_authorization_scheme_param
from starlette.status import HTTP_401_UNAUTHORIZED

from chainlit.config import DEFAULT_HOST, config

""" Module level cookie settings. """
_cookie_samesite = cast(
    Literal["lax", "strict", "none"],
    os.environ.get("CHAINLIT_COOKIE_SAMESITE", "lax"),
)

assert _cookie_samesite in [
    "lax",
    "strict",
    "none",
], (
    "Invalid value for CHAINLIT_COOKIE_SAMESITE. Must be one of 'lax', 'strict' or 'none'."
)
_cookie_secure = _cookie_samesite == "none"

_LOCALHOST_HOSTS = {"localhost", "127.0.0.1", "::1", DEFAULT_HOST}


def _is_localhost(request: Optional[Request] = None) -> bool:
    """Return True when the request originates from a localhost integration
    or the server itself is bound to a localhost address.

    Checks (in order):
    1. The ``Origin`` request header – where the browser front-end is running.
    2. ``request.client.host`` – the direct TCP peer address.
    3. ``config.run.host`` – the address Chainlit is listening on.
    """
    if request is not None:
        origin = request.headers.get("origin", "")
        if origin:
            # Strip scheme and port: "http://localhost:3000" -> "localhost"
            origin_host = origin.split("//", 1)[-1].split(":")[0]
            if origin_host in _LOCALHOST_HOSTS:
                return True

        if request.client and request.client.host in _LOCALHOST_HOSTS:
            return True

    return getattr(config.run, "host", "") in _LOCALHOST_HOSTS


def _resolve_cookie_settings(
    request: Optional[Request] = None,
) -> Tuple[Literal["lax", "strict", "none"], bool]:
    """Return ``(samesite, secure)`` for the current request context.

    When ``CHAINLIT_COOKIE_SAMESITE`` is not explicitly set and the integration
    is running from localhost, ``samesite`` is forced to ``'none'`` so that
    cookies are accepted in cross-origin scenarios (e.g. iframe / copilot widget).
    """
    samesite = _cookie_samesite
    if not os.environ.get("CHAINLIT_COOKIE_SAMESITE") and _is_localhost(request):
        samesite = cast(Literal["lax", "strict", "none"], "none")
    secure = samesite == "none"
    return samesite, secure


if _cookie_root_path := os.environ.get("CHAINLIT_ROOT_PATH", None):
    _cookie_path = os.environ.get(_cookie_root_path, "/")
else:
    _cookie_path = os.environ.get("CHAINLIT_AUTH_COOKIE_PATH", "/")
_state_cookie_lifetime = 3 * 60  # 3m
_auth_cookie_name = os.environ.get("CHAINLIT_AUTH_COOKIE_NAME", "access_token")
_state_cookie_name = "oauth_state"


class OAuth2PasswordBearerWithCookie(SecurityBase):
    """
    OAuth2 password flow with cookie support with fallback to bearer token.
    """

    def __init__(
        self,
        tokenUrl: str,
        scheme_name: Optional[str] = None,
        auto_error: bool = True,
    ):
        self.tokenUrl = tokenUrl
        self.scheme_name = scheme_name or self.__class__.__name__
        self.auto_error = auto_error
        flows = OAuthFlowsModel(
            password=cast(
                Any,
                {"tokenUrl": tokenUrl, "scopes": {}},
            )
        )
        self.model = OAuth2Model(flows=flows)

    async def __call__(self, request: Request) -> Optional[str]:
        # First try to get the token from the cookie
        token = get_token_from_cookies(request.cookies)

        # If no cookie, try the Authorization header as fallback
        if not token:
            # TODO: Only bother to check if cookie auth is explicitly disabled.
            authorization = request.headers.get("Authorization")
            if authorization:
                scheme, token = get_authorization_scheme_param(authorization)
                if scheme.lower() != "bearer":
                    if self.auto_error:
                        raise HTTPException(
                            status_code=HTTP_401_UNAUTHORIZED,
                            detail="Invalid authentication credentials",
                            headers={"WWW-Authenticate": "Bearer"},
                        )
                    else:
                        return None
            else:
                if self.auto_error: 
                    raise HTTPException(
                        status_code=HTTP_401_UNAUTHORIZED,
                        detail="Not authenticated",
                        headers={"WWW-Authenticate": "Bearer"},
                    )
                else:
                    return None

        return token


def _get_chunked_cookie(cookies: dict[str, str], name: str) -> Optional[str]:
    # Gather all auth_chunk_i cookies, sorted by their index
    chunk_parts = []

    i = 0
    while True:
        cookie_key = f"{_auth_cookie_name}_{i}"
        if cookie_key not in cookies:
            break

        chunk_parts.append(cookies[cookie_key])
        i += 1

    joined = "".join(chunk_parts)

    return joined if joined != "" else None


def get_token_from_cookies(cookies: dict[str, str]) -> Optional[str]:
    """
    Read all chunk cookies and reconstruct the token
    """

    # Default/unchunked cookies
    if value := cookies.get(_auth_cookie_name):
        return value

    return _get_chunked_cookie(cookies, _auth_cookie_name)


def set_auth_cookie(request: Request, response: Response, token: str):
    """
    Helper function to set the authentication cookie with secure parameters
    and remove any leftover chunks from a previously larger token.
    """

    _chunk_size = 3000
    samesite, secure = _resolve_cookie_settings(request)

    existing_cookies = {
        k for k in request.cookies.keys() if k.startswith(_auth_cookie_name)
    }

    if len(token) > _chunk_size:
        chunks = [token[i : i + _chunk_size] for i in range(0, len(token), _chunk_size)]

        for i, chunk in enumerate(chunks):
            k = f"{_auth_cookie_name}_{i}"

            response.set_cookie(
                key=k,
                value=chunk,
                httponly=True,
                secure=secure,
                samesite=samesite,
                max_age=config.project.user_session_timeout,
            )

            existing_cookies.discard(k)
    else:
        # Default (shorter cookies)
        response.set_cookie(
            key=_auth_cookie_name,
            value=token,
            httponly=True,
            secure=secure,
            samesite=samesite,
            max_age=config.project.user_session_timeout,
        )

        existing_cookies.discard(_auth_cookie_name)

    # Delete remaining prior cookies/cookie chunks
    for k in existing_cookies:
        response.delete_cookie(
            key=k, path=_cookie_path, secure=secure, samesite=samesite
        )


def clear_auth_cookie(request: Request, response: Response):
    """
    Helper function to clear the authentication cookie
    """

    samesite, secure = _resolve_cookie_settings(request)

    existing_cookies = {
        k for k in request.cookies.keys() if k.startswith(_auth_cookie_name)
    }

    for k in existing_cookies:
        response.delete_cookie(
            key=k, path=_cookie_path, secure=secure, samesite=samesite
        )


def set_oauth_state_cookie(response: Response, token: str):
    samesite, secure = _resolve_cookie_settings()
    response.set_cookie(
        _state_cookie_name,
        token,
        httponly=True,
        samesite=samesite,
        secure=secure,
        max_age=_state_cookie_lifetime,
    )


def validate_oauth_state_cookie(request: Request, state: str):
    """Check the state from the oauth provider against the browser cookie."""

    oauth_state = request.cookies.get(_state_cookie_name)

    if oauth_state != state:
        raise Exception("oauth state does not correspond")


def clear_oauth_state_cookie(response: Response):
    """Oauth complete, delete state token."""
    response.delete_cookie(_state_cookie_name)  # Do we set path here?
 