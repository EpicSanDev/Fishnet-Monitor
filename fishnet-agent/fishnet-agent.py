#!/usr/bin/env python3
# Fishnet Monitor Agent - Script à installer sur chaque serveur Fishnet

import os
import sys
import json
import time
import socket
import logging
import platform
import subprocess
import requests
from datetime import datetime
import psutil

# Configuration par défaut (peut être modifiée via fichier de config ou variables d'environnement)
CONFIG = {
    "server_url": "http://dashboard-server:3000/api/stats",  # URL du serveur de dashboard
    "interval": 30,  # Intervalle d'envoi en secondes
    "server_name": socket.gethostname(),  # Nom du serveur par défaut (hostname)
    "log_file": "/var/log/fishnet-agent.log",  # Fichier de log
    "fishnet_process_name": "fishnet",  # Nom du processus Fishnet
    "fishnet_service_name": "fishnet",  # Nom du service Fishnet (systemd)
}

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(CONFIG["log_file"]),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("fishnet-agent")

def load_config():
    """Charge la configuration depuis un fichier ou des variables d'environnement"""
    # Vérifier les variables d'environnement
    if os.environ.get("FISHNET_MONITOR_URL"):
        CONFIG["server_url"] = os.environ.get("FISHNET_MONITOR_URL")
    if os.environ.get("FISHNET_MONITOR_INTERVAL"):
        CONFIG["interval"] = int(os.environ.get("FISHNET_MONITOR_INTERVAL"))
    if os.environ.get("FISHNET_MONITOR_NAME"):
        CONFIG["server_name"] = os.environ.get("FISHNET_MONITOR_NAME")
    if os.environ.get("FISHNET_PROCESS_NAME"):
        CONFIG["fishnet_process_name"] = os.environ.get("FISHNET_PROCESS_NAME")
    
    # Log de la configuration chargée
    logger.info(f"Configuration chargée: {json.dumps(CONFIG, indent=2)}")

def get_system_stats():
    """Collecte les statistiques système"""
    stats = {
        "cpuUsage": psutil.cpu_percent(interval=1),
        "memoryUsage": psutil.virtual_memory().percent,
        "diskUsage": psutil.disk_usage('/').percent,
        "uptime": int(time.time() - psutil.boot_time())
    }
    return stats

def get_fishnet_status():
    """Vérifie le statut du service Fishnet"""
    status = "unknown"
    active_jobs = 0
    
    # Vérifier si le processus Fishnet est en cours d'exécution
    fishnet_running = False
    for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
        if CONFIG["fishnet_process_name"] in proc.info['name'] or \
           any(CONFIG["fishnet_process_name"] in cmd for cmd in proc.info['cmdline'] if cmd):
            fishnet_running = True
            break
    
    if fishnet_running:
        status = "running"
        
        # Tenter de récupérer le nombre de jobs actifs
        # Cette partie peut nécessiter des ajustements selon la façon dont Fishnet expose ses informations
        try:
            # Exemple: lecture d'un fichier de stats ou appel API locale
            # Cette partie est spécifique à votre configuration Fishnet
            active_jobs = get_active_jobs_count()
        except Exception as e:
            logger.warning(f"Impossible de récupérer le nombre de jobs actifs: {e}")
    else:
        status = "stopped"
    
    return {
        "fishnetStatus": status,
        "activeJobs": active_jobs
    }

def get_active_jobs_count():
    """Récupère le nombre de jobs actifs (à adapter selon votre configuration)"""
    # Cette fonction est un exemple et devrait être adaptée à votre configuration spécifique
    # Par exemple, Fishnet pourrait exposer une API locale ou écrire des logs avec ces informations
    
    try:
        # Exemple 1: Vérifier dans un fichier de log récent
        with open("/var/log/fishnet/current.log", "r") as f:
            last_lines = f.readlines()[-50:]  # Lire les 50 dernières lignes
            for line in reversed(last_lines):
                if "active jobs:" in line.lower():
                    return int(line.split("active jobs:")[1].strip().split()[0])
        
        # Exemple 2: Exécuter une commande fishnet spécifique
        # result = subprocess.check_output(["fishnet", "status"]).decode("utf-8")
        # for line in result.split("\n"):
        #     if "active jobs:" in line.lower():
        #         return int(line.split(":")[1].strip())
        
        # Si aucune information trouvée, estimation basée sur le CPU
        cpu_per_process = psutil.cpu_percent(interval=0.5) / psutil.cpu_count()
        if cpu_per_process > 50:
            return 3  # Estimation haute
        elif cpu_per_process > 20:
            return 2  # Estimation moyenne
        elif cpu_per_process > 5:
            return 1  # Estimation basse
        return 0
        
    except Exception as e:
        logger.error(f"Erreur lors de la récupération du nombre de jobs: {e}")
        return 0

def collect_data():
    """Collecte toutes les données et renvoie un objet structuré"""
    system_stats = get_system_stats()
    fishnet_stats = get_fishnet_status()
    
    data = {
        "name": CONFIG["server_name"],
        "timestamp": datetime.utcnow().isoformat(),
        "status": "online",
        "data": {**system_stats, **fishnet_stats}
    }
    
    return data

def send_data(data):
    """Envoie les données au serveur de dashboard"""
    try:
        headers = {"Content-Type": "application/json"}
        response = requests.post(CONFIG["server_url"], json=data, headers=headers, timeout=5)
        
        if response.status_code == 201:
            logger.info(f"Données envoyées avec succès: {response.status_code}")
            return True
        else:
            logger.error(f"Erreur lors de l'envoi des données: {response.status_code} - {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        logger.error(f"Erreur de connexion au serveur: {e}")
        return False

def main():
    """Fonction principale du script"""
    # Charger la configuration
    load_config()
    
    logger.info(f"Agent de surveillance Fishnet démarré sur {CONFIG['server_name']}")
    logger.info(f"Envoi des données à {CONFIG['server_url']} toutes les {CONFIG['interval']} secondes")
    
    # Boucle principale
    while True:
        try:
            # Collecter les données
            data = collect_data()
            logger.debug(f"Données collectées: {json.dumps(data)}")
            
            # Envoyer les données
            success = send_data(data)
            
            # Si l'envoi a échoué, stocker localement pour réessayer plus tard
            if not success:
                # Stockage local simple, à améliorer selon les besoins
                backup_file = f"/tmp/fishnet-agent-{int(time.time())}.json"
                with open(backup_file, "w") as f:
                    json.dump(data, f)
                logger.info(f"Données sauvegardées dans {backup_file}")
                
                # Tenter de renvoyer les sauvegardes précédentes
                for file in os.listdir("/tmp"):
                    if file.startswith("fishnet-agent-") and file.endswith(".json"):
                        try:
                            file_path = os.path.join("/tmp", file)
                            with open(file_path, "r") as f:
                                backup_data = json.load(f)
                            if send_data(backup_data):
                                os.remove(file_path)
                                logger.info(f"Sauvegarde {file} envoyée et supprimée")
                        except Exception as e:
                            logger.error(f"Erreur lors du traitement de la sauvegarde {file}: {e}")
            
        except Exception as e:
            logger.error(f"Erreur dans la boucle principale: {e}")
            
        # Attendre avant la prochaine collecte
        time.sleep(CONFIG["interval"])

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        logger.info("Agent arrêté par l'utilisateur")
        sys.exit(0)
    except Exception as e:
        logger.critical(f"Erreur fatale: {e}")
        sys.exit(1)
