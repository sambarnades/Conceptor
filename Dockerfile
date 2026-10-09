FROM python:3.10.21-slim-trixie

WORKDIR /usr/src/app

COPY ./caramel /usr/src/app/

CMD ["python3", "-m", "http.server", "8000"]

