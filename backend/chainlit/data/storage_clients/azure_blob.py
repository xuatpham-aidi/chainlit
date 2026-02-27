from datetime import datetime, timedelta, timezone
from typing import TYPE_CHECKING, Any, Dict, Optional, Union

from azure.core.exceptions import ResourceExistsError
from azure.storage.blob import BlobSasPermissions, ContentSettings, generate_blob_sas
from azure.storage.blob.aio import BlobServiceClient as AsyncBlobServiceClient

from chainlit.data.storage_clients.base import BaseStorageClient, storage_expiry_time
from chainlit.logger import logger

if TYPE_CHECKING:
    from azure.core.credentials import TokenCredential


class AzureBlobStorageClient(BaseStorageClient):
    """
    Azure Blob Storage client. Supports either account key or TokenCredential
    (e.g. service principal, managed identity via ainfra get_credential()).
    """

    def __init__(
        self,
        container_name: str,
        storage_account: str,
        storage_key: Optional[str] = None,
        credential: Optional["TokenCredential"] = None,
    ):
        self.container_name = container_name
        self.storage_account = storage_account
        self.storage_key = storage_key
        self._credential = credential
        if storage_key is not None:
            connection_string = (
                f"DefaultEndpointsProtocol=https;"
                f"AccountName={storage_account};"
                f"AccountKey={storage_key};"
                f"EndpointSuffix=core.windows.net"
            )
            self.service_client = AsyncBlobServiceClient.from_connection_string(
                connection_string
            )
        elif credential is not None:
            account_url = (
                f"https://{storage_account}.blob.core.windows.net"
            )
            self.service_client = AsyncBlobServiceClient(
                account_url=account_url, credential=credential
            )
            self._user_delegation_key: Any = None
            self._user_delegation_key_expiry: Optional[datetime] = None
        else:
            raise ValueError(
                "AzureBlobStorageClient requires either storage_key or credential"
            )
        self.container_client = self.service_client.get_container_client(
            self.container_name
        )
        self._container_ensured = False
        logger.info("AzureBlobStorageClient initialized")

    async def _ensure_container(self) -> None:
        if self._container_ensured:
            return
        try:
            await self.container_client.create_container()
            logger.info(
                "Azure Blob container created: %s", self.container_name
            )
        except ResourceExistsError:
            pass
        self._container_ensured = True

    async def _get_user_delegation_key(self) -> Any:
        if (
            self._user_delegation_key is not None
            and self._user_delegation_key_expiry is not None
            and datetime.now(tz=timezone.utc) < self._user_delegation_key_expiry
        ):
            return self._user_delegation_key
        start = datetime.now(tz=timezone.utc)
        expiry = start + timedelta(hours=1)
        self._user_delegation_key = (
            await self.service_client.get_user_delegation_key(
                key_start_time=start, key_expiry_time=expiry
            )
        )
        self._user_delegation_key_expiry = expiry
        return self._user_delegation_key

    async def get_read_url(self, object_key: str) -> str:
        start_time = datetime.now(tz=timezone.utc)
        expiry_time = start_time + timedelta(seconds=storage_expiry_time)
        sas_permissions = BlobSasPermissions(read=True)
        base_url = (
            f"https://{self.storage_account}.blob.core.windows.net"
            f"/{self.container_name}/{object_key}"
        )
        if self.storage_key is not None:
            sas_token = generate_blob_sas(
                account_name=self.storage_account,
                container_name=self.container_name,
                blob_name=object_key,
                account_key=self.storage_key,
                permission=sas_permissions,
                start=start_time,
                expiry=expiry_time,
            )
        else:
            user_delegation_key = await self._get_user_delegation_key()
            sas_token = generate_blob_sas(
                account_name=self.storage_account,
                container_name=self.container_name,
                blob_name=object_key,
                user_delegation_key=user_delegation_key,
                permission=sas_permissions,
                start=start_time,
                expiry=expiry_time,
            )
        return f"{base_url}?{sas_token}"

    async def upload_file(
        self,
        object_key: str,
        data: Union[bytes, str],
        mime: str = "application/octet-stream",
        overwrite: bool = True,
        content_disposition: str | None = None,
    ) -> Dict[str, Any]:
        try:
            await self._ensure_container()
            blob_client = self.container_client.get_blob_client(object_key)

            if isinstance(data, str):
                data = data.encode("utf-8")

            content_settings = ContentSettings(
                content_type=mime, content_disposition=content_disposition
            )

            await blob_client.upload_blob(
                data, overwrite=overwrite, content_settings=content_settings
            )

            properties = await blob_client.get_blob_properties()

            return {
                "path": object_key,
                "object_key": object_key,
                "url": await self.get_read_url(object_key),
                "size": properties.size,
                "last_modified": properties.last_modified,
                "etag": properties.etag,
                "content_type": properties.content_settings.content_type,
            }

        except Exception as e:
            raise Exception(f"Failed to upload file to Azure Blob Storage: {e!s}")

    async def delete_file(self, object_key: str) -> bool:
        try:
            blob_client = self.container_client.get_blob_client(blob=object_key)
            await blob_client.delete_blob()
            return True
        except Exception as e:
            logger.warning(f"AzureBlobStorageClient, delete_file error: {e}")
            return False

    async def close(self) -> None:
        await self.container_client.close()
        await self.service_client.close()
