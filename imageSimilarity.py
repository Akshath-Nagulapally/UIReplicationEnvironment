"""Compare two images using mean squared error (MSE) and root mean squared error (RMSE)."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import numpy as np
from PIL import Image


def load_rgb(path: Path) -> np.ndarray:
    img = Image.open(path).convert("RGB")
    return np.asarray(img, dtype=np.float64)


def resize_to_match(target_hw: tuple[int, int], arr: np.ndarray) -> np.ndarray:
    h, w = target_hw
    if arr.shape[0] == h and arr.shape[1] == w:
        return arr
    pil = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))
    resized = pil.resize((w, h), Image.Resampling.LANCZOS)
    return np.asarray(resized, dtype=np.float64)


def mse_rmse(a: np.ndarray, b: np.ndarray) -> tuple[float, float]:
    diff = a - b
    mse = float(np.mean(diff**2))
    rmse = float(np.sqrt(mse))
    return mse, rmse


def main() -> None:
    parser = argparse.ArgumentParser(
        description="MSE / RMSE between two images (RGB, pixel-wise). Lower is more similar."
    )
    parser.add_argument("image_a", type=Path, help="First image path (reference size when sizes differ)")
    parser.add_argument("image_b", type=Path, help="Second image path (resized to match first if needed)")
    args = parser.parse_args()

    path_a = args.image_a.resolve()
    path_b = args.image_b.resolve()
    for p in (path_a, path_b):
        if not p.is_file():
            print(f"error: not a file: {p}", file=sys.stderr)
            sys.exit(1)

    print(f"Image A: {path_a}")
    print(f"Image B: {path_b}")

    a = load_rgb(path_a)
    b = load_rgb(path_b)
    b = resize_to_match((a.shape[0], a.shape[1]), b)

    mse, rmse = mse_rmse(a, b)
    print(f"MSE:  {mse:.6f}")
    print(f"RMSE: {rmse:.6f}")


if __name__ == "__main__":
    main()