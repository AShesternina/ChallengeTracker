import os
import uuid

from slowapi import Limiter
from slowapi.util import get_remote_address


def _rate_limit_key(request):
    if os.getenv("PYTEST_ALLOW") == "1":
        return str(uuid.uuid4())  # unique per request — rate limits never trigger in tests
    return get_remote_address(request)


limiter = Limiter(key_func=_rate_limit_key)
