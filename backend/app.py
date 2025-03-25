import os
import re
import csv
import json
import logging # Import logging first
import uuid
import traceback
from datetime import datetime, timedelta
from pathlib import Path
# Import standard typing AFTER standard libraries
from typing import List, Dict, Any, Optional, Tuple, Union, TypedDict

import firebase_admin
from firebase_admin import credentials, firestore

# Import external libraries
import requests
from flask import Flask, request, jsonify, abort
from flask_cors import CORS
import google.generativeai as genai
import chromadb
from chromadb import PersistentClient, EmbeddingFunction

from chromadb.api.models.Collection import Collection       
from typing import List, Dict, Any, Optional, TypedDict # Add TypedDict here

import config
