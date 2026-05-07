import numpy as np


def calculate_delta(
    f: np.ndarray,
    thick_range: tuple[float, float, float],
    e_real: np.ndarray,
    e_imag: np.ndarray,
    u_real: np.ndarray,
    u_imag: np.ndarray,
) -> dict:
    """计算Delta参数。

    Args:
        f: 频率数组 (Hz)
        thick_range: (起始厚度mm, 结束厚度mm, 步长mm)
        e_real, e_imag, u_real, u_imag: 电磁参数实部虚部

    Returns:
        dict: {delta: 2D array, frequency: array, thickness: array}
    """
    thickness = np.arange(thick_range[0], thick_range[1] + thick_range[2], thick_range[2]) / 1000
    c = 299792458

    delta_result = []
    for i in range(len(f)):
        delta_list = []
        freq = f[i]
        for d in thickness:
            tane = np.arctan(e_imag[i] / e_real[i])
            tanu = np.arctan(u_imag[i] / u_real[i])
            k1 = e_real[i] * u_real[i]
            k2 = np.sqrt(e_real[i] * u_real[i])
            K = (4 * np.pi * k2 * np.sin((tane + tanu) / 2)) / (c * np.cos(tane) * np.cos(tanu))
            M = (4 * k1 * np.cos(tane) * np.cos(tanu)) / (
                (u_real[i] * np.cos(tane) - e_real[i] * np.cos(tanu)) ** 2
                + (np.tan((tanu - tane) / 2) * (u_real[i] * np.cos(tane) + e_real[i] * np.cos(tanu))) ** 2
            )
            delta = abs(np.sinh(K * freq * d) ** 2 - M)
            delta_list.append(delta)
        delta_result.append(delta_list)

    return {
        "delta": np.array(delta_result),
        "frequency": f / 1e9,
        "thickness": np.arange(thick_range[0], thick_range[1] + thick_range[2], thick_range[2]),
    }
