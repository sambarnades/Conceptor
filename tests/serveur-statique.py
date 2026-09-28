"""Serveur statique des bancs de test : `python3 -m http.server`, file d'attente élargie.

    python3 tests/serveur-statique.py 8000 --bind 127.0.0.1

Même ligne de commande et même comportement que `python3 -m http.server`, à une
différence près : la file d'attente des connexions passe de 5 à 128.

Pourquoi (15 sept. 2026) : au premier chargement, Caramel demande des centaines
de modules ES en rafale. Avec la file de 5 du module standard, macOS REFUSE les
connexions en trop au lieu de les faire patienter : le navigateur reçoit
`ERR_CONNECTION_RESET`, un module ne se charge pas, la page reste inerte et le
banc échoue au hasard sur son premier `waitForSelector`. Mesuré : 3 chargements
à froid ratés sur 12 (18 connexions coupées) avec la file de 5, 0 sur 12 avec
128. C'était la cause des bancs « instables » qu'il fallait relancer.
"""
import runpy
import socketserver
import sys

# `runpy` réexécute `http.server` dans un espace neuf : ses classes sont recréées,
# mais elles héritent toujours de `socketserver.TCPServer`, déjà importé ici.
socketserver.TCPServer.request_queue_size = 128

sys.argv[0] = 'http.server'
runpy.run_module('http.server', run_name='__main__', alter_sys=True)
