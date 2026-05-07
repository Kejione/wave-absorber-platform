import json
import pandas as pd
import numpy as np


def export_to_excel(rl_data: dict, im_data: dict, delta_data: dict, output_path: str) -> str:
    """将计算结果导出为Excel文件。"""
    rl_df = pd.DataFrame(rl_data["rl"], index=rl_data["frequency"], columns=rl_data["thickness"])
    im_df = pd.DataFrame(im_data["im"], index=im_data["frequency"], columns=im_data["thickness"])
    delta_df = pd.DataFrame(delta_data["delta"], index=delta_data["frequency"], columns=delta_data["thickness"])

    with pd.ExcelWriter(output_path) as writer:
        rl_df.to_excel(writer, sheet_name="RL")
        im_df.to_excel(writer, sheet_name="IM")
        delta_df.to_excel(writer, sheet_name="Delta")

    return output_path


def export_result_json(rl_data: dict, im_data: dict, delta_data: dict, area_ratios: dict, output_path: str) -> str:
    """将计算结果导出为JSON（用于前端图表渲染）。"""
    result = {
        "rl": {
            "frequency": rl_data["frequency"].tolist(),
            "thickness": rl_data["thickness"].tolist(),
            "values": rl_data["rl"].tolist(),
        },
        "im": {
            "frequency": im_data["frequency"].tolist(),
            "thickness": im_data["thickness"].tolist(),
            "values": im_data["im"].tolist(),
        },
        "delta": {
            "frequency": delta_data["frequency"].tolist(),
            "thickness": delta_data["thickness"].tolist(),
            "values": delta_data["delta"].tolist(),
        },
        "area_ratios": area_ratios,
    }

    with open(output_path, "w") as f:
        json.dump(result, f)

    return output_path
