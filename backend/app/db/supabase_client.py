import threading

from supabase import create_client, Client

from app.config import settings

# One Supabase client PER THREAD. The client's underlying httpx (HTTP/2)
# connection is not safe for concurrent use across threads — a single shared
# client hit by FastAPI's threadpool + our parallel `gather()` queries caused
# `httpx.ReadError [WinError 10035]` and sporadic 500s. Per-thread clients each
# own their connection, so there's never concurrent access to one socket. Threads
# are reused (FastAPI threadpool + the persistent gather executor), so the client
# is created once per thread and cached thereafter.
_local = threading.local()


def get_client() -> Client:
    client = getattr(_local, "client", None)
    if client is None:
        client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
        _local.client = client
    return client
