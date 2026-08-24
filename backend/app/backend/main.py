from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.upload import router as upload_router
from app.api.send import router as send_router
from app.api.gmail import router as gmail_router


app = FastAPI(
    title="Ritnav Mailer API",
    version="1.0.0",
)


# ------------------------------------------------------------------
# CORS
# ------------------------------------------------------------------


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=[
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "OPTIONS",
    ],
    allow_headers=[
        "*",
    ],
)


# ------------------------------------------------------------------
# API Routers
# ------------------------------------------------------------------

app.include_router(
    upload_router,
)

app.include_router(
    send_router,
)

app.include_router(
    gmail_router,
)


# ------------------------------------------------------------------
# Health / Root
# ------------------------------------------------------------------

@app.get("/")
async def root():
    return {
        "name": "Ritnav Mailer API",
        "status": "running",
        "version": "1.0.0",
    }


@app.get("/health")
async def health():
    return {
        "status": "ok",
    }