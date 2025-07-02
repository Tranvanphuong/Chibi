import http.server
import socketserver

PORT = 8000

Handler = http.server.SimpleHTTPRequestHandler
Handler.extensions_map.update({
    '.js': 'application/javascript',
    '.pdf': 'application/pdf',
})

print(f"Server starting at http://localhost:{PORT}")
with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print("Press Ctrl+C to stop the server")
    httpd.serve_forever() 