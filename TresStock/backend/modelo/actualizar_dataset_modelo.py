"""Empaqueta el dataset diario recién generado para el próximo reentrenamiento."""
import gzip
import shutil
import argparse
from pathlib import Path


CARPETA_MODELO = Path(__file__).resolve().parent
RAIZ_PROYECTO = CARPETA_MODELO.parents[1]
ORIGEN = (
    RAIZ_PROYECTO
    / "python"
    / "data_raw"
    / "modelo_inicial"
    / "04_estacionalidad_tendencias"
    / "dataset_estacionalidad_tendencias.csv"
)
DESTINO = CARPETA_MODELO / "dataset_estacionalidad_tendencias.csv.gz"


def main():
    parser = argparse.ArgumentParser(description="Comprime y guarda el dataset diario que usará el próximo entrenamiento.")
    parser.add_argument("archivo_csv", nargs="?", type=Path, default=ORIGEN, help="CSV limpio diario; por omisión usa el generado en python/data_raw.")
    ruta_origen = parser.parse_args().archivo_csv.resolve()
    if not ruta_origen.is_file():
        raise FileNotFoundError(f"No se encontró el dataset diario: {ruta_origen}")
    with ruta_origen.open("rb") as archivo_origen, gzip.open(DESTINO, "wb", compresslevel=6) as archivo_destino:
        shutil.copyfileobj(archivo_origen, archivo_destino)
    print(f"Dataset del modelo actualizado: {DESTINO}")
    print(f"Tamaño comprimido: {DESTINO.stat().st_size:,} bytes")


if __name__ == "__main__":
    main()
