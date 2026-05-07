import numpy as np
from cmath import sqrt, tanh


def calculate_rl_im(
    f: np.ndarray,
    e: np.ndarray,
    u: np.ndarray,
    thick_range: tuple[float, float, float],
) -> dict:
    """计算反射损耗(RL)和输入阻抗(IM)。

    Args:
        f: 频率数组 (Hz)
        e: 复数介电常数数组
        u: 复数磁导率数组
        thick_range: (起始厚度mm, 结束厚度mm, 步长mm)

    Returns:
        dict: {rl: 2D array, im: 2D array, frequency: array, thickness: array}
    """
    c = 299792458  # 光速
    thickness = np.arange(thick_range[0], thick_range[1] + thick_range[2], thick_range[2]) / 1000  # 转为米

    im_result = []
    rl_result = []

    for i in range(len(f)):
        im_list = []
        rl_list = []
        freq = f[i]
        for d in thickness:
            zin = sqrt(u[i] / e[i]) * tanh(1j * (2 * np.pi * freq * d / c) * sqrt(u[i] * e[i]))
            im = abs(zin)
            im_list.append(im)
            rl = 20 * np.log10(abs((zin - 1) / (zin + 1)))
            rl_list.append(rl)
        im_result.append(im_list)
        rl_result.append(rl_list)

    return {
        "rl": np.array(rl_result),
        "im": np.array(im_result),
        "frequency": f / 1e9,  # 转为GHz用于前端展示
        "thickness": np.arange(thick_range[0], thick_range[1] + thick_range[2], thick_range[2]),
    }


def calculate_area_ratio(values: np.ndarray, threshold: float, mode: str = "below") -> float:
    """计算面积占比。

    Args:
        values: 2D数组
        threshold: 阈值
        mode: "below" 表示小于阈值, "range" 表示在范围内(用于IM)

    Returns:
        float: 面积占比百分比
    """
    if mode == "below":
        mask = values <= threshold
    else:
        mask = values >= threshold[0] if isinstance(threshold, (list, tuple)) else values <= threshold

    pixel_count = np.sum(mask)
    total_count = values.size
    if total_count == 0:
        return 0.0
    return (pixel_count / total_count) * 100
