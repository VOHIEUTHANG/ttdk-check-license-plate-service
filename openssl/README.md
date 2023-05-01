This folder contains
PEM file
KEY file
CRT file

openssl x509 -outform der -in cert.pem -out cert.crt
openssl rsa -outform der -in cert.pem -out cert.key
