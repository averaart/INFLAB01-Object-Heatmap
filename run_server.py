from cherrypy import wsgiserver
from app import app

d = wsgiserver.WSGIPathInfoDispatcher({'/': app})
server = wsgiserver.CherryPyWSGIServer(('0.0.0.0', 8080), d)

if not app.debug:
    import logging
    from logging import FileHandler
    file_handler = FileHandler("errors.log")
    file_handler.setLevel(logging.WARNING)
    app.logger.addHandler(file_handler)

if __name__ == '__main__':
    try:
        server.start()
    except KeyboardInterrupt:
        server.stop()