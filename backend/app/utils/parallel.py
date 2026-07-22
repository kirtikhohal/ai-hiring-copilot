from concurrent.futures import ThreadPoolExecutor

# A PERSISTENT pool so its worker threads (and their per-thread Supabase clients)
# are reused across calls — otherwise every gather() would spin up new threads
# that each pay a fresh TLS handshake. Each Supabase query is a ~300ms network
# round-trip, so running the independent ones concurrently (each on its own
# thread → its own connection) turns several sequential round-trips into ~one.
_EXECUTOR = ThreadPoolExecutor(max_workers=12, thread_name_prefix="dbq")


def gather(*fns):
    """Run independent zero-arg callables concurrently, results in order."""
    if not fns:
        return []
    if len(fns) == 1:
        return [fns[0]()]
    return [f.result() for f in [_EXECUTOR.submit(fn) for fn in fns]]
