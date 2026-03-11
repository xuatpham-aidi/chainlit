import os
from abc import ABC, abstractmethod
from typing import Any, Dict, Optional, Union

storage_expiry_time = int(os.getenv("STORAGE_EXPIRY_TIME", 3600))


class BaseStorageClient(ABC):
    """Base class for non-text data persistence like Azure Data Lake, S3, Google Storage, etc."""

    @abstractmethod
    async def upload_file(
        self,
        object_key: str,
        data: Union[bytes, str],
        mime: str = "application/octet-stream",
        overwrite: bool = True,
        content_disposition: str | None = None,
    ) -> Dict[str, Any]:
        pass

    @abstractmethod
    async def delete_file(self, object_key: str) -> bool:
        pass

    @abstractmethod
    async def get_read_url(self, object_key: str) -> str:
        pass

    async def get_file_content(
        self, object_key: str, encoding: str = "utf-8"
    ) -> Optional[str]:
        """Download blob content as string. Override in subclasses that support it."""
        return None

    async def get_file_bytes(self, object_key: str) -> Optional[bytes]:
        """Download blob content as raw bytes. Override in subclasses that support it."""
        return None

    @abstractmethod
    async def close(self) -> None:
        pass
