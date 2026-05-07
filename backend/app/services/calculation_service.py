import os
from app.core.data_reader import read_data
from app.core.reflection_loss import calculate_rl_im, calculate_area_ratio
from app.core.delta import calculate_delta
from app.utils.export import export_to_excel, export_result_json
from app.config import get_settings

settings = get_settings()


def run_calculation(file_path: str, params: dict) -> tuple[str, dict]:
    """执行完整计算流程，返回结果文件路径和结果数据。"""
    data = read_data(file_path)

    thick_range = tuple(params.get("thick_range", [0, 5, 0.01]))
    rl_threshold = params.get("rl_threshold", -10)
    im_threshold = params.get("im_threshold", [0.52, 1.93])
    delta_threshold = params.get("delta_threshold", 0.3)

    rl_data = calculate_rl_im(data["f"], data["e"], data["u"], thick_range)
    delta_data = calculate_delta(
        data["f"], thick_range, data["e_real"], data["e_imag"], data["u_real"], data["u_imag"]
    )

    rl_area = calculate_area_ratio(rl_data["rl"], rl_threshold, mode="below")
    im_area = calculate_area_ratio(rl_data["im"], im_threshold, mode="range")
    delta_area = calculate_area_ratio(delta_data["delta"], delta_threshold, mode="below")

    area_ratios = {
        "rl": round(float(rl_area), 2),
        "im": round(float(im_area), 2),
        "delta": round(float(delta_area), 2),
    }

    base_name = os.path.splitext(os.path.basename(file_path))[0]
    excel_path = os.path.join(settings.RESULT_DIR, f"{base_name}_RL_IM_Delta.xlsx")
    json_path = os.path.join(settings.RESULT_DIR, f"{base_name}_RL_IM_Delta.json")

    export_to_excel(rl_data, rl_data, delta_data, excel_path)
    export_result_json(rl_data, rl_data, delta_data, area_ratios, json_path)

    return excel_path, {
        "rl": rl_data,
        "im": rl_data,
        "delta": delta_data,
        "area_ratios": area_ratios,
    }
