import numpy as np
import pandas as pd
from pathlib import Path


def read_data(file_path: str) -> dict:
    """读取电磁参数数据文件，支持 .dat / .eu / .xlsx 格式。

    Returns:
        dict: 包含 f(Hz), e(复数), u(复数), e_real, e_imag, u_real, u_imag
    """
    path = Path(file_path)
    suffix = path.suffix.lower()

    if suffix == ".dat":
        df = pd.read_csv(path, sep="\t", skiprows=2, header=None, encoding="utf-8")
        f = df.iloc[:, 0].values * 1e9
        e_real = df.iloc[:, 1].values
        e_imag = df.iloc[:, 2].values
        u_real = df.iloc[:, 3].values
        u_imag = df.iloc[:, 4].values
    elif suffix == ".eu":
        df = pd.read_csv(path, sep="\t", skiprows=13, header=None, encoding="ANSI")
        f = df.iloc[:, 0].values * 1e9
        e_real = df.iloc[:, 1].values
        e_imag = df.iloc[:, 2].values
        u_real = df.iloc[:, 4].values
        u_imag = df.iloc[:, 5].values
    elif suffix == ".xlsx":
        df = pd.read_excel(path, header=None, index_col=None)
        f = df.iloc[:, 0].values * 1e9
        e_real = df.iloc[:, 1].values
        e_imag = df.iloc[:, 2].values
        u_real = df.iloc[:, 3].values
        u_imag = df.iloc[:, 4].values
    else:
        raise ValueError(f"不支持的文件格式: {suffix}")

    e = e_real - 1j * e_imag
    u = u_real - 1j * u_imag

    return {
        "f": f,
        "e": e,
        "u": u,
        "e_real": e_real,
        "e_imag": e_imag,
        "u_real": u_real,
        "u_imag": u_imag,
    }
