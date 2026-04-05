import uvicorn
import socket


def is_port_in_use(host: str, port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.settimeout(0.5)
        return sock.connect_ex((host, port)) == 0

if __name__ == "__main__":
    host = "0.0.0.0"
    port = 8000
    probe_host = "127.0.0.1"

    if is_port_in_use(probe_host, port):
        print(f"Backend already running on http://{probe_host}:{port}. Skipping new start.")
    else:
        uvicorn.run("backend.main:app", host=host, port=port, reload=False)
