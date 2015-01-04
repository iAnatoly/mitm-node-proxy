mitm-node-proxy
===============

This is a simple HTTP/HTTPS MITM proxy I run to limit my distractions on my home system.

It came into being because of three facts:
- First, I use hosts file entries to blacklist some of the sites I visit too often (like reddit);
- Second, I use local HTTP server to redirect 127.0.0.1 to another site I do not find harmful at the moment (say, HN)
- Third, I still like an option to browse some areas of reddit from time to time.

How it works:
- I redirect all the traffic from all systems to local proxy server listening on 80 and 443
- proxy server looks at the request URI, and decides to proxy the request to the real site, or block the request
- It does not work too well with HTTPS. Implementing transparent MITM is possible, but it would be a lot of work to implement. It is still on my TODO list

--Anatoly.
