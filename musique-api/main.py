from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from routers import tracks, stream

load_dotenv()

app = FastAPI(title="Musique API", version="1.0.0")

app.include_router(tracks.router)
app.include_router(stream.router)

# CORS — React frontend ko allow karna
app.add_middleware(
    CORSMiddleware,
    # allow_origins=["*"],  # baad mein restrict karenge
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers (baad mein add karenge)
# from routers import tracks, stream
# app.include_router(tracks.router)
# app.include_router(stream.router)

@app.get("/")
def root():
    return {"message": "Musique API is running 🎵"}

@app.get("/health")
def health():
    return {"status": "ok"}