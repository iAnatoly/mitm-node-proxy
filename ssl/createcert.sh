echo "generating the private key"
openssl genrsa  -out server.key 2048
echo "generating certificate request"
openssl req -new -key server.key -out server.csr
echo "generating the certificate"
openssl x509 -req -days 3650 -in server.csr -signkey server.key -out server.pem
