from fastapi import APIRouter, HTTPException
from google.oauth2 import service_account
from googleapiclient.discovery import build
import os

router = APIRouter(prefix="/tracks", tags=["tracks"])

def get_drive_service():
    credentials = service_account.Credentials.from_service_account_file(
        os.getenv("GOOGLE_SERVICE_ACCOUNT_FILE"),
        scopes=["https://www.googleapis.com/auth/drive.readonly"]
    )
    return build("drive", "v3", credentials=credentials)

@router.get("/")
def list_tracks(skip: int = 0, limit: int = 50):
    try:
        drive = get_drive_service()
        folder_id = os.getenv("DRIVE_FOLDER_ID")

        all_files = []
        page_token = None

        while True:
            params = {
                "q": f"'{folder_id}' in parents and trashed = false and mimeType contains 'audio/'",
                "fields": "nextPageToken, files(id, name, mimeType, size)",
                "orderBy": "name",
                "pageSize": 1000
            }
            if page_token:
                params["pageToken"] = page_token

            results = drive.files().list(**params).execute()
            all_files.extend(results.get("files", []))
            page_token = results.get("nextPageToken")
            if not page_token:
                break

        # Pagination
        paginated = all_files[skip: skip + limit]

        return {
            "status": "success",
            "total": len(all_files),
            "skip": skip,
            "limit": limit,
            "tracks": paginated
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))