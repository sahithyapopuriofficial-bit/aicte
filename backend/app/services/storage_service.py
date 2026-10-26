# backend/app/services/storage_service.py
import os
import uuid
import hashlib
from typing import BinaryIO, Tuple
from fastapi import HTTPException, status
from app.core.config import settings

ALLOWED_MIME_TYPES = {
    "application/pdf": [b"%PDF-"],
    "image/jpeg": [b"\xff\xd8\xff"],
    "image/png": [b"\x89PNG\r\n\x1a\n"],
}

MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB maximum upload limit


class StorageService:
    def __init__(self, base_path: str = settings.LOCAL_STORAGE_DIR):
        self.base_path = base_path
        os.makedirs(self.base_path, exist_ok=True)

    def save_file(self, file_obj: BinaryIO, declared_mime_type: str, original_filename: str) -> Tuple[str, str, int]:
        """
        Validate file headers, calculate SHA-256 hash, and write to storage using an opaque UUID path.
        Returns: (storage_key, sha256_checksum, total_bytes)
        """
        if declared_mime_type not in ALLOWED_MIME_TYPES:
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail=f"Unsupported file type '{declared_mime_type}'. Only PDF, JPEG, and PNG are allowed.",
            )

        header = file_obj.read(16)
        file_obj.seek(0)

        # Inspect magic bytes to prevent renamed malicious payloads
        valid_signatures = ALLOWED_MIME_TYPES[declared_mime_type]
        if not any(header.startswith(sig) for sig in valid_signatures):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File content does not match the declared MIME type signature.",
            )

        storage_uuid = str(uuid.uuid4())
        ext = os.path.splitext(original_filename)[1].lower()
        safe_key = f"{storage_uuid}{ext}"
        destination_path = os.path.join(self.base_path, safe_key)

        hasher = hashlib.sha256()
        total_size = 0

        with open(destination_path, "wb") as dest:
            while chunk := file_obj.read(64 * 1024):
                total_size += len(chunk)
                if total_size > MAX_FILE_SIZE_BYTES:
                    dest.close()
                    if os.path.exists(destination_path):
                        os.remove(destination_path)
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail="File exceeds maximum permissible size limit of 10 MB.",
                    )
                hasher.update(chunk)
                dest.write(chunk)

        return safe_key, hasher.hexdigest(), total_size

    def get_file_path(self, storage_key: str) -> str:
        """
        Resolve filesystem path and defend against path traversal attacks.
        """
        normalized_path = os.path.abspath(os.path.join(self.base_path, storage_key))
        if not normalized_path.startswith(os.path.abspath(self.base_path)):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Illegal path traversal sequence detected.",
            )
        if not os.path.exists(normalized_path):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Requested physical file was not found on storage node.",
            )
        return normalized_path