import os
import uuid
from typing import Optional, Tuple
from app.core.config import settings

# Initialize Supabase client if keys are provided
_supabase_client = None

def get_supabase_client():
    global _supabase_client
    if _supabase_client is None and settings.SUPABASE_URL and (settings.SUPABASE_SECRET_KEY or settings.SUPABASE_PUBLISHABLE_KEY):
        try:
            from supabase import create_client, Client
            key = settings.SUPABASE_SECRET_KEY or settings.SUPABASE_PUBLISHABLE_KEY
            _supabase_client = create_client(settings.SUPABASE_URL, key)
        except Exception as e:
            print(f"Supabase Client Init Note: {e}")
            _supabase_client = None
    return _supabase_client


class StorageService:
    @staticmethod
    def upload_file(bucket_name: str, file_bytes: bytes, file_name: str, content_type: str = "application/octet-stream") -> Tuple[str, str]:
        """
        Uploads a file to Supabase Storage.
        Falls back to local file storage if Supabase credentials are not configured.
        Returns: (file_path, public_url)
        """
        supabase = get_supabase_client()
        unique_name = f"{uuid.uuid4()}_{file_name.replace(' ', '_')}"
        
        if supabase:
            try:
                # Ensure bucket exists
                try:
                    supabase.storage.get_bucket(bucket_name)
                except Exception:
                    supabase.storage.create_bucket(bucket_name, options={"public": True})

                res = supabase.storage.from_(bucket_name).upload(
                    path=unique_name,
                    file=file_bytes,
                    file_options={"content-type": content_type}
                )
                
                # Get Public URL
                public_url = supabase.storage.from_(bucket_name).get_public_url(unique_name)
                return unique_name, public_url
            except Exception as e:
                print(f"Supabase Storage upload warning: {e}. Falling back to local storage.")

        # Local Fallback
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        local_path = os.path.join(settings.UPLOAD_DIR, unique_name)
        with open(local_path, "wb") as f:
            f.write(file_bytes)

        return unique_name, f"/api/v1/documents/raw/{unique_name}"

    @staticmethod
    def delete_file(bucket_name: str, file_path: str) -> bool:
        supabase = get_supabase_client()
        if supabase:
            try:
                supabase.storage.from_(bucket_name).remove([file_path])
                return True
            except Exception as e:
                print(f"Supabase delete note: {e}")

        # Local cleanup
        local_path = os.path.join(settings.UPLOAD_DIR, file_path)
        if os.path.exists(local_path):
            try:
                os.remove(local_path)
                return True
            except Exception:
                pass
        return True
