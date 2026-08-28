from __future__ import annotations

from typing import Annotated, Any
from pydantic import Field, WithJsonSchema
from base.context import get_client
from ..utils.response import (
    async_task_response,
    error_response,
    sync_result_response,
)

TOOL_NAMES = ['add_image_to_video', 'add_subtitle_to_video', 'adjust_audio_speed', 'adjust_video_speed', 'adjust_video_volume', 'apply_camera_motion', 'apply_video_filter', 'concat_audio', 'concat_video', 'crop_video', 'extract_animated_image', 'extract_audio', 'fade_audio', 'fade_video_audio', 'flip_video', 'image_to_video', 'mix_audio', 'mux_audio_video', 'rotate_video', 'stitch_video', 'text_to_scrolling_video', 'trim_audio', 'trim_video']


def _structured_error(exc: Exception) -> object:
    response = getattr(exc, "response", None)
    if response is not None:
        try:
            return response.json()
        except Exception:
            pass
    return {"message": str(exc)}


def register_tools(mcp) -> None:
    @mcp.tool(name='add_image_to_video', description='支持将指定图片（如 Logo、水印等）叠加到视频画面上。')
    async def add_image_to_video(
        sub_image_url: Annotated[str, WithJsonSchema({'description': '待添加的图片 URL。图片来源仅支持公网可访问的 HTTP/HTTPS URL。建议使用 PNG、JPG、JPEG 等常见图片格式；推荐使用带透明通道的 PNG 格式以获得最佳水印效果。', 'format': 'media-to-url', 'type': 'string'})] = Field(...),
        video_url: Annotated[str, WithJsonSchema({'description': '待添加图片的视频 URL。视频来源支持公网 HTTP/HTTPS URL、视频点播 vod:// 和对象存储 tos:// 三种输入协议。支持 mp4、flv、ts、avi、mov、wmv、mkv 等主流视频格式，最高支持 4K（3840×2160）分辨率。建议输入文件大小不超过 10 GB。', 'format': 'media-to-url', 'type': 'string'})] = Field(...),
        callback_args: Annotated[str | None, WithJsonSchema({'description': '自定义回调参数；任务完成时会通过事件回调原样返回，用于关联业务；字段长度最大为 512 字节。 仅在用户明确提供该值时传递；不得由 Agent 生成、推断或补写。', 'type': 'string'})] = Field(None),
        callback_url: Annotated[str | None, WithJsonSchema({'description': '用于接收该任务结果回调的 URL 地址；提供后优先级高于全局回调地址；地址必须以 http:// 或 https:// 开头。 仅在用户明确提供该值时传递；不得由 Agent 生成、推断或补写。', 'type': 'string'})] = Field(None),
        client_token: Annotated[str | None, WithJsonSchema({'description': '用户请求凭证，用于幂等控制；大小写敏感，长度不超过 64 个 ASCII 可打印字符。 默认不传。用户明确指定时原样使用；用户明确要求重试时，同一逻辑请求的重试链必须复用同一 token。已有 token 时必须复用原值；此前请求未带 token 时，可从本次重试开始创建一次并持续复用，但该 token 不对此前请求提供追溯幂等。业务参数变化视为新请求，不得复用旧 token。不得为每次尝试生成不同值。调用端运行时不判断重试意图，也不自动生成 token。', 'type': 'string'})] = Field(None),
        end_time: Annotated[float | None, WithJsonSchema({'description': '图片结束显示的时间，单位为秒。默认与视频结束时间一致。如果 end_time 超出原始视频时长，输出视频长度将延长至该 end_time，超出部分将以黑屏形式延续，图片会继续显示在黑屏上。', 'minimum': 0, 'type': 'number'})] = Field(None),
        media_output_destination: Annotated[str | None, WithJsonSchema({'description': '指定处理产物的目标存储位置；支持将处理产物存储至火山引擎视频点播（VOD）空间或对象存储（TOS）桶。存储至 VOD 时设为 `vod://<您的空间名>`，存储至 TOS 时设为 `tos://<您的桶名>`。设置后，任务结果中的 `url` 相关字段返回 `vod://` 或 `tos://` 格式的资源地址，不再返回临时下载地址。首次使用前需按需授权 AI MediaKit 将文件写入您的 VOD 空间或 TOS 桶。 仅在用户明确提供该值时传递；不得由 Agent 生成、推断或补写。', 'type': 'string'})] = Field(None),
        queue_id: Annotated[str | None, WithJsonSchema({'description': '任务提交的目标队列 ID；不传时默认使用系统自动创建的队列 ID。可将不同业务或优先级的任务提交到不同队列，以按队列对应的项目进行分账。队列可创建和管理，系统会自动分配队列 ID。 仅在用户明确提供该值时传递；不得由 Agent 生成、推断或补写。', 'type': 'string'})] = Field(None),
        start_time: Annotated[float | None, WithJsonSchema({'description': '图片开始显示的时间，单位为秒。默认与视频开始时间一致。', 'minimum': 0, 'type': 'number'})] = Field(None),
        sub_image_height: Annotated[str | None, WithJsonSchema({'default': '5%', 'description': '图片高度支持像素值或相对于视频高度的百分比，默认值为 "5%"。', 'pattern': '^(\\d{1,4}|\\d{1,3}%)$', 'type': 'string'})] = Field(None, json_schema_extra={'default': '5%'}),
        sub_image_pos_x: Annotated[str | None, WithJsonSchema({'default': '85%', 'description': '图片左上角在水平方向（X 轴）的位置，以视频左上角 "0" 为原点，支持像素值或百分比，默认值为 "85%"。', 'pattern': '^(\\d{1,4}|\\d{1,3}%)$', 'type': 'string'})] = Field(None, json_schema_extra={'default': '85%'}),
        sub_image_pos_y: Annotated[str | None, WithJsonSchema({'default': '90%', 'description': '图片左上角在垂直方向（Y 轴）的位置，以视频左上角 "0" 为原点，支持像素值或百分比，默认值为 "90%"。', 'pattern': '^(\\d{1,4}|\\d{1,3}%)$', 'type': 'string'})] = Field(None, json_schema_extra={'default': '90%'}),
        sub_image_width: Annotated[str | None, WithJsonSchema({'default': '10%', 'description': '图片宽度支持像素值或相对于视频宽度的百分比，默认值为 "10%"。', 'pattern': '^(\\d{1,4}|\\d{1,3}%)$', 'type': 'string'})] = Field(None, json_schema_extra={'default': '10%'}),
    ) -> dict:
        try:
            result = get_client().call('add_image_to_video', **{
                key: item for key, item in {'sub_image_url': sub_image_url, 'video_url': video_url, 'callback_args': callback_args, 'callback_url': callback_url, 'client_token': client_token, 'end_time': end_time, 'media_output_destination': media_output_destination, 'queue_id': queue_id, 'start_time': start_time, 'sub_image_height': sub_image_height, 'sub_image_pos_x': sub_image_pos_x, 'sub_image_pos_y': sub_image_pos_y, 'sub_image_width': sub_image_width}.items()
                if item is not None
            })
            return async_task_response(result)
        except Exception as exc:
            return error_response(_structured_error(exc))

    @mcp.tool(name='add_subtitle_to_video', description='将字幕文件或文本内容按自定义样式压制到视频画面中，生成带内嵌字幕的新视频。')
    async def add_subtitle_to_video(
        video_url: Annotated[str, WithJsonSchema({'description': 'video_url 是待添加字幕的视频 URL，支持公网 HTTP/HTTPS、火山引擎视频点播 vod:// 和火山引擎对象存储 tos:// 三种输入协议，支持 mp4、flv、ts、avi、mov、wmv、mkv 等主流视频格式；最高支持 4K（3840×2160）分辨率；建议输入视频文件大小不超过 10 GB。', 'format': 'media-to-url', 'type': 'string'})] = Field(...),
        callback_args: Annotated[str | None, WithJsonSchema({'description': '自定义回调参数；任务完成时会通过事件回调原样返回，用于关联业务；字段长度最大为 512 字节。 仅在用户明确提供该值时传递；不得由 Agent 生成、推断或补写。', 'type': 'string'})] = Field(None),
        callback_url: Annotated[str | None, WithJsonSchema({'description': '用于接收该任务结果回调的 URL 地址；提供后优先级高于全局回调地址；地址必须以 http:// 或 https:// 开头。 仅在用户明确提供该值时传递；不得由 Agent 生成、推断或补写。', 'type': 'string'})] = Field(None),
        client_token: Annotated[str | None, WithJsonSchema({'description': '用户请求凭证，用于幂等控制；大小写敏感，长度不超过 64 个 ASCII 可打印字符。 默认不传。用户明确指定时原样使用；用户明确要求重试时，同一逻辑请求的重试链必须复用同一 token。已有 token 时必须复用原值；此前请求未带 token 时，可从本次重试开始创建一次并持续复用，但该 token 不对此前请求提供追溯幂等。业务参数变化视为新请求，不得复用旧 token。不得为每次尝试生成不同值。调用端运行时不判断重试意图，也不自动生成 token。', 'type': 'string'})] = Field(None),
        media_output_destination: Annotated[str | None, WithJsonSchema({'description': '指定处理产物的目标存储位置；支持将处理产物存储至火山引擎视频点播（VOD）空间或对象存储（TOS）桶。存储至 VOD 时设为 `vod://<您的空间名>`，存储至 TOS 时设为 `tos://<您的桶名>`。设置后，任务结果中的 `url` 相关字段返回 `vod://` 或 `tos://` 格式的资源地址，不再返回临时下载地址。首次使用前需按需授权 AI MediaKit 将文件写入您的 VOD 空间或 TOS 桶。 仅在用户明确提供该值时传递；不得由 Agent 生成、推断或补写。', 'type': 'string'})] = Field(None),
        queue_id: Annotated[str | None, WithJsonSchema({'description': '任务提交的目标队列 ID；不传时默认使用系统自动创建的队列 ID。可将不同业务或优先级的任务提交到不同队列，以按队列对应的项目进行分账。队列可创建和管理，系统会自动分配队列 ID。 仅在用户明确提供该值时传递；不得由 Agent 生成、推断或补写。', 'type': 'string'})] = Field(None),
        subtitle_font_color: Annotated[str | None, WithJsonSchema({'default': '#FFFFFFFF', 'description': 'subtitle_font_color 非必填，字幕字体颜色采用 RGBA 格式，默认 #FFFFFFFF，表示不透明白色。', 'type': 'string'})] = Field(None, json_schema_extra={'default': '#FFFFFFFF'}),
        subtitle_font_size: Annotated[int | None, WithJsonSchema({'default': 50, 'description': 'subtitle_font_size 非必填，字幕字体大小单位为 px，默认 50 px。字号不得超过所选位置预设的最大渲染高度，即视频原始高度 × height 百分比（例如 height 为 10% 时，最大字号为视频高度的 10%）；同时单行字数 × 字号不得超过所选位置预设的 width（视频原始宽度 × width 百分比，例如 80%）。', 'minimum': 1, 'type': 'integer'})] = Field(None, json_schema_extra={'default': 50}),
        subtitle_font_type: Annotated[str | None, WithJsonSchema({'default': 'sy_black', 'description': 'subtitle_font_type 非必填，支持 sy_black（思源黑体，经典无衬线黑体，端正百搭，正文首选）；支持 pm_zhengdao（庞门正道标题体，粗壮有力，适合大标题或封面）；支持 zhanku_kuaile（站酷快乐体，圆润活泼并带手写感，适合轻松搞笑的 Vlog 氛围）；默认 sy_black，即思源黑体。', 'enum': ['sy_black', 'pm_zhengdao', 'ali_puhui', 'zhanku_kuaile'], 'type': 'string'})] = Field(None, json_schema_extra={'default': 'sy_black'}),
        subtitle_pos_preset: Annotated[str | None, WithJsonSchema({'default': 'bottom_center', 'description': 'subtitle_pos_preset 非必填，通过预设值快速将字幕放到画面常用位置；支持 bottom_center（底部居中，默认，推荐横屏使用）、top_center（顶部居中）、center（画面正中央）、lower_third（偏下三分之一处，推荐竖屏使用）。用户未指定位置时：横屏使用 bottom_center，竖屏使用 lower_third。各预设对应的字幕渲染区域为：top_center 为 width 80%、height 10%、pos_x 10%、pos_y 5%；center 为 width 80%、height 15%、pos_x 10%、pos_y 42.5%；lower_third 为 width 80%、height 10%、pos_x 10%、pos_y 70%；bottom_center 为 width 80%、height 10%、pos_x 10%、pos_y 85%。其中 height 为相对视频原始高度的字体渲染最大高度，width 为相对视频原始宽度的字幕区域最大宽度。若当前没有视频宽高信息，可先探测视频元信息获取宽高后再选择位置与字号。若成片用于短视频或漫剧平台，设置位置前应向用户确认，并避开对应平台的操作栏、进度条和互动控件，避免字幕被遮挡。', 'enum': ['bottom_center', 'top_center', 'center', 'lower_third'], 'type': 'string'})] = Field(None, json_schema_extra={'default': 'bottom_center'}),
        subtitle_url: Annotated[str | None, WithJsonSchema({'description': 'subtitle_url 非必填，用于提供字幕文件 URL，仅支持公网可访问的 HTTP/HTTPS URL，支持 SRT、VTT、ASS 等常见字幕格式；subtitle_url 与 subtitles 同时存在时，优先使用 subtitle_url 的内容。', 'format': 'media-to-url', 'type': 'string'})] = Field(None),
        subtitles: Annotated[list[Any] | None, WithJsonSchema({'description': 'subtitles 非必填，是由多个字幕对象组成的字幕内容列表；每个对象包含字幕文本、开始时间和结束时间。', 'items': {'properties': {'end_time': {'description': '该条字幕结束显示的时间，单位为秒。', 'minimum': 0, 'type': 'number'}, 'start_time': {'description': '该条字幕开始显示的时间，单位为秒。', 'minimum': 0, 'type': 'number'}, 'subtitle_text': {'description': '单条字幕的文本内容。', 'type': 'string'}}, 'required': ['subtitle_text', 'start_time', 'end_time'], 'type': 'object'}, 'minItems': 0, 'type': 'array'})] = Field(None),
    ) -> dict:
        try:
            result = get_client().call('add_subtitle_to_video', **{
                key: item for key, item in {'video_url': video_url, 'callback_args': callback_args, 'callback_url': callback_url, 'client_token': client_token, 'media_output_destination': media_output_destination, 'queue_id': queue_id, 'subtitle_font_color': subtitle_font_color, 'subtitle_font_size': subtitle_font_size, 'subtitle_font_type': subtitle_font_type, 'subtitle_pos_preset': subtitle_pos_preset, 'subtitle_url': subtitle_url, 'subtitles': subtitles}.items()
                if item is not None
            })
            return async_task_response(result)
        except Exception as exc:
            return error_response(_structured_error(exc))

    @mcp.tool(name='adjust_audio_speed', description='用于音频调速，可调整音频播放倍速，实现快放或慢放效果。')
    async def adjust_audio_speed(
        audio_url: Annotated[str, WithJsonSchema({'description': '待调速的音频 URL。支持公网 HTTP/HTTPS URL、来源于火山引擎视频点播 vod:// 和火山引擎对象存储 tos:// 三种输入协议；支持 mp3、m4a、wav 等主流音频格式；建议单个输入文件大小不超过 10 GB。', 'format': 'media-to-url', 'type': 'string'})] = Field(...),
        callback_args: Annotated[str | None, WithJsonSchema({'description': '自定义回调参数；任务完成时会通过事件回调原样返回，用于关联业务；字段长度最大为 512 字节。 仅在用户明确提供该值时传递；不得由 Agent 生成、推断或补写。', 'type': 'string'})] = Field(None),
        callback_url: Annotated[str | None, WithJsonSchema({'description': '用于接收该任务结果回调的 URL 地址；提供后优先级高于全局回调地址；地址必须以 http:// 或 https:// 开头。 仅在用户明确提供该值时传递；不得由 Agent 生成、推断或补写。', 'type': 'string'})] = Field(None),
        client_token: Annotated[str | None, WithJsonSchema({'description': '用户请求凭证，用于幂等控制；大小写敏感，长度不超过 64 个 ASCII 可打印字符。 默认不传。用户明确指定时原样使用；用户明确要求重试时，同一逻辑请求的重试链必须复用同一 token。已有 token 时必须复用原值；此前请求未带 token 时，可从本次重试开始创建一次并持续复用，但该 token 不对此前请求提供追溯幂等。业务参数变化视为新请求，不得复用旧 token。不得为每次尝试生成不同值。调用端运行时不判断重试意图，也不自动生成 token。', 'type': 'string'})] = Field(None),
        format: Annotated[str | None, WithJsonSchema({'default': 'm4a', 'description': '输出音频格式。支持 mp3、m4a、ogg、flac、wav；默认值为 m4a。', 'enum': ['mp3', 'm4a', 'ogg', 'flac', 'wav'], 'type': 'string'})] = Field(None, json_schema_extra={'default': 'm4a'}),
        media_output_destination: Annotated[str | None, WithJsonSchema({'description': '指定处理产物的目标存储位置；支持将处理产物存储至火山引擎视频点播（VOD）空间或对象存储（TOS）桶。存储至 VOD 时设为 `vod://<您的空间名>`，存储至 TOS 时设为 `tos://<您的桶名>`。设置后，任务结果中的 `url` 相关字段返回 `vod://` 或 `tos://` 格式的资源地址，不再返回临时下载地址。首次使用前需按需授权 AI MediaKit 将文件写入您的 VOD 空间或 TOS 桶。 仅在用户明确提供该值时传递；不得由 Agent 生成、推断或补写。', 'type': 'string'})] = Field(None),
        queue_id: Annotated[str | None, WithJsonSchema({'description': '任务提交的目标队列 ID；不传时默认使用系统自动创建的队列 ID。可将不同业务或优先级的任务提交到不同队列，以按队列对应的项目进行分账。队列可创建和管理，系统会自动分配队列 ID。 仅在用户明确提供该值时传递；不得由 Agent 生成、推断或补写。', 'type': 'string'})] = Field(None),
        speed: Annotated[float | None, WithJsonSchema({'default': 1, 'description': '音频播放倍速为 0.1 至最高 4.0；1.0 表示原速，小于 1.0 表示慢放，大于 1.0 表示快放。', 'maximum': 4, 'minimum': 0.1, 'type': 'number'})] = Field(None, json_schema_extra={'default': 1}),
    ) -> dict:
        try:
            result = get_client().call('adjust_audio_speed', **{
                key: item for key, item in {'audio_url': audio_url, 'callback_args': callback_args, 'callback_url': callback_url, 'client_token': client_token, 'format': format, 'media_output_destination': media_output_destination, 'queue_id': queue_id, 'speed': speed}.items()
                if item is not None
            })
            return async_task_response(result)
        except Exception as exc:
            return error_response(_structured_error(exc))

    @mcp.tool(name='adjust_video_speed', description='用于视频调速，通过调整播放倍速产生快放或慢放效果。')
    async def adjust_video_speed(
        video_url: Annotated[str, WithJsonSchema({'description': '待调速视频的 URL。支持公网 HTTP/HTTPS、火山引擎视频点播 vod:// 和火山引擎对象存储 tos:// 三种输入协议；支持 mp4、flv、ts、avi、mov、wmv、mkv 等主流视频格式；最高支持 4K（3840×2160）分辨率；建议输入文件大小不超过 10 GB。', 'format': 'media-to-url', 'type': 'string'})] = Field(...),
        callback_args: Annotated[str | None, WithJsonSchema({'description': '自定义回调参数；任务完成时会通过事件回调原样返回，用于关联业务；字段长度最大为 512 字节。 仅在用户明确提供该值时传递；不得由 Agent 生成、推断或补写。', 'type': 'string'})] = Field(None),
        callback_url: Annotated[str | None, WithJsonSchema({'description': '用于接收该任务结果回调的 URL 地址；提供后优先级高于全局回调地址；地址必须以 http:// 或 https:// 开头。 仅在用户明确提供该值时传递；不得由 Agent 生成、推断或补写。', 'type': 'string'})] = Field(None),
        client_token: Annotated[str | None, WithJsonSchema({'description': '用户请求凭证，用于幂等控制；大小写敏感，长度不超过 64 个 ASCII 可打印字符。 默认不传。用户明确指定时原样使用；用户明确要求重试时，同一逻辑请求的重试链必须复用同一 token。已有 token 时必须复用原值；此前请求未带 token 时，可从本次重试开始创建一次并持续复用，但该 token 不对此前请求提供追溯幂等。业务参数变化视为新请求，不得复用旧 token。不得为每次尝试生成不同值。调用端运行时不判断重试意图，也不自动生成 token。', 'type': 'string'})] = Field(None),
        media_output_destination: Annotated[str | None, WithJsonSchema({'description': '指定处理产物的目标存储位置；支持将处理产物存储至火山引擎视频点播（VOD）空间或对象存储（TOS）桶。存储至 VOD 时设为 `vod://<您的空间名>`，存储至 TOS 时设为 `tos://<您的桶名>`。设置后，任务结果中的 `url` 相关字段返回 `vod://` 或 `tos://` 格式的资源地址，不再返回临时下载地址。首次使用前需按需授权 AI MediaKit 将文件写入您的 VOD 空间或 TOS 桶。 仅在用户明确提供该值时传递；不得由 Agent 生成、推断或补写。', 'type': 'string'})] = Field(None),
        queue_id: Annotated[str | None, WithJsonSchema({'description': '任务提交的目标队列 ID；不传时默认使用系统自动创建的队列 ID。可将不同业务或优先级的任务提交到不同队列，以按队列对应的项目进行分账。队列可创建和管理，系统会自动分配队列 ID。 仅在用户明确提供该值时传递；不得由 Agent 生成、推断或补写。', 'type': 'string'})] = Field(None),
        speed: Annotated[float | None, WithJsonSchema({'default': 1, 'description': '播放速度倍数，取值范围 0.1～4.0，默认值为 1.0，表示原速；大于 1.0 表示快放，小于 1.0 表示慢放。', 'maximum': 4, 'minimum': 0.1, 'type': 'number'})] = Field(None, json_schema_extra={'default': 1}),
    ) -> dict:
        try:
            result = get_client().call('adjust_video_speed', **{
                key: item for key, item in {'video_url': video_url, 'callback_args': callback_args, 'callback_url': callback_url, 'client_token': client_token, 'media_output_destination': media_output_destination, 'queue_id': queue_id, 'speed': speed}.items()
                if item is not None
            })
            return async_task_response(result)
        except Exception as exc:
            return error_response(_structured_error(exc))

    @mcp.tool(name='adjust_video_volume', description='用于调整输入视频的音量大小，也可实现静音。')
    async def adjust_video_volume(
        video_url: Annotated[str, WithJsonSchema({'description': '待处理的视频 URL。支持公网 HTTP/HTTPS URL、火山引擎视频点播 vod:// 和火山引擎对象存储 tos:// 三种输入协议；支持 mp4、flv、ts、avi、mov、wmv、mkv 等主流视频格式；最高支持 4K（3840×2160）分辨率；建议单个输入文件大小不超过 10 GB。', 'format': 'media-to-vid', 'type': 'string'})] = Field(...),
        callback_args: Annotated[str | None, WithJsonSchema({'description': '自定义回调参数；任务完成时会通过事件回调原样返回，用于关联业务；字段长度最大为 512 字节。 仅在用户明确提供该值时传递；不得由 Agent 生成、推断或补写。', 'type': 'string'})] = Field(None),
        callback_url: Annotated[str | None, WithJsonSchema({'description': '用于接收该任务结果回调的 URL 地址；提供后优先级高于全局回调地址；地址必须以 http:// 或 https:// 开头。 仅在用户明确提供该值时传递；不得由 Agent 生成、推断或补写。', 'type': 'string'})] = Field(None),
        client_token: Annotated[str | None, WithJsonSchema({'description': '用户请求凭证，用于幂等控制；大小写敏感，长度不超过 64 个 ASCII 可打印字符。 默认不传。用户明确指定时原样使用；用户明确要求重试时，同一逻辑请求的重试链必须复用同一 token。已有 token 时必须复用原值；此前请求未带 token 时，可从本次重试开始创建一次并持续复用，但该 token 不对此前请求提供追溯幂等。业务参数变化视为新请求，不得复用旧 token。不得为每次尝试生成不同值。调用端运行时不判断重试意图，也不自动生成 token。', 'type': 'string'})] = Field(None),
        media_output_destination: Annotated[str | None, WithJsonSchema({'description': '指定处理产物的目标存储位置；支持将处理产物存储至火山引擎视频点播（VOD）空间或对象存储（TOS）桶。存储至 VOD 时设为 `vod://<您的空间名>`，存储至 TOS 时设为 `tos://<您的桶名>`。设置后，任务结果中的 `url` 相关字段返回 `vod://` 或 `tos://` 格式的资源地址，不再返回临时下载地址。首次使用前需按需授权 AI MediaKit 将文件写入您的 VOD 空间或 TOS 桶。 仅在用户明确提供该值时传递；不得由 Agent 生成、推断或补写。', 'type': 'string'})] = Field(None),
        queue_id: Annotated[str | None, WithJsonSchema({'description': '任务提交的目标队列 ID；不传时默认使用系统自动创建的队列 ID。可将不同业务或优先级的任务提交到不同队列，以按队列对应的项目进行分账。队列可创建和管理，系统会自动分配队列 ID。 仅在用户明确提供该值时传递；不得由 Agent 生成、推断或补写。', 'type': 'string'})] = Field(None),
        volume: Annotated[float | None, WithJsonSchema({'default': 1, 'description': '音量调整倍数，非必填，可省略；需使用浮点数，范围为 0 到 4。0 表示静音，1 表示保持原音量；小于 1 表示减小音量，大于 1 表示放大音量。', 'maximum': 4, 'minimum': 0, 'type': 'number'})] = Field(None, json_schema_extra={'default': 1}),
    ) -> dict:
        try:
            result = get_client().call('adjust_video_volume', **{
                key: item for key, item in {'video_url': video_url, 'callback_args': callback_args, 'callback_url': callback_url, 'client_token': client_token, 'media_output_destination': media_output_destination, 'queue_id': queue_id, 'volume': volume}.items()
                if item is not None
            })
            return async_task_response(result)
        except Exception as exc:
            return error_response(_structured_error(exc))

    @mcp.tool(name='apply_camera_motion', description='对输入视频在指定时间段内添加一种运镜特效，常用于素材二次创作、营销片头、短剧动效等场景。')
    async def apply_camera_motion(
        video_url: Annotated[str, WithJsonSchema({'description': '待处理的视频 URL。支持公网 HTTP/HTTPS URL、火山引擎视频点播 vod:// 和火山引擎对象存储 tos:// 三种输入协议；支持 mp4、flv、ts、avi、mov、wmv、mkv 等格式；最高支持 1080p 分辨率；视频时长不得超过 5 分钟。', 'format': 'media-to-vid', 'type': 'string'})] = Field(...),
        callback_args: Annotated[str | None, WithJsonSchema({'description': '自定义回调参数；任务完成时会通过事件回调原样返回，用于关联业务；字段长度最大为 512 字节。 仅在用户明确提供该值时传递；不得由 Agent 生成、推断或补写。', 'type': 'string'})] = Field(None),
        callback_url: Annotated[str | None, WithJsonSchema({'description': '用于接收该任务结果回调的 URL 地址；提供后优先级高于全局回调地址；地址必须以 http:// 或 https:// 开头。 仅在用户明确提供该值时传递；不得由 Agent 生成、推断或补写。', 'type': 'string'})] = Field(None),
        client_token: Annotated[str | None, WithJsonSchema({'description': '用户请求凭证，用于幂等控制；大小写敏感，长度不超过 64 个 ASCII 可打印字符。 默认不传。用户明确指定时原样使用；用户明确要求重试时，同一逻辑请求的重试链必须复用同一 token。已有 token 时必须复用原值；此前请求未带 token 时，可从本次重试开始创建一次并持续复用，但该 token 不对此前请求提供追溯幂等。业务参数变化视为新请求，不得复用旧 token。不得为每次尝试生成不同值。调用端运行时不判断重试意图，也不自动生成 token。', 'type': 'string'})] = Field(None),
        end_time: Annotated[float | None, WithJsonSchema({'description': '运镜结束时间，单位为秒，支持设置为 2 位小数，需大于 start_time；默认到视频结尾；仅传 start_time 时会运镜到视频结尾；若填写值超过视频实际时长，将自动按视频时长处理。', 'minimum': 0, 'type': 'number'})] = Field(None),
        motion_style: Annotated[str | None, WithJsonSchema({'default': 'zoom', 'description': '运镜风格，支持 zoom、pan-zoom、orbit-360、bounce 几种预设效果，默认值为 zoom。', 'enum': ['zoom', 'pan-zoom', 'orbit-360', 'bounce'], 'type': 'string'})] = Field(None, json_schema_extra={'default': 'zoom'}),
        queue_id: Annotated[str | None, WithJsonSchema({'description': '任务提交的目标队列 ID；不传时默认使用系统自动创建的队列 ID。可将不同业务或优先级的任务提交到不同队列，以按队列对应的项目进行分账。队列可创建和管理，系统会自动分配队列 ID。 仅在用户明确提供该值时传递；不得由 Agent 生成、推断或补写。', 'type': 'string'})] = Field(None),
        start_time: Annotated[float | None, WithJsonSchema({'default': 0, 'description': '运镜开始时间，单位为秒，支持设置为 2 位小数，不得小于 0；默认值为 0，0 表示从视频片头开始；仅传 end_time 时按 0 作为开始时间。', 'minimum': 0, 'type': 'number'})] = Field(None, json_schema_extra={'default': 0}),
    ) -> dict:
        try:
            result = get_client().call('apply_camera_motion', **{
                key: item for key, item in {'video_url': video_url, 'callback_args': callback_args, 'callback_url': callback_url, 'client_token': client_token, 'end_time': end_time, 'motion_style': motion_style, 'queue_id': queue_id, 'start_time': start_time}.items()
                if item is not None
            })
            return async_task_response(result)
        except Exception as exc:
            return error_response(_structured_error(exc))

    @mcp.tool(name='apply_video_filter', description='为指定视频添加滤镜效果。')
    async def apply_video_filter(
        video_url: Annotated[str, WithJsonSchema({'description': '待处理视频 URL。支持公网 HTTP/HTTPS URL、视频点播 vod:// 和对象存储 tos:// 三种输入协议；支持 mp4、flv、ts、avi、mov、wmv、mkv 等主流视频格式；最高支持 4K（3840×2160）分辨率；建议单个输入文件大小不超过 10 GB。', 'format': 'media-to-vid', 'type': 'string'})] = Field(...),
        callback_args: Annotated[str | None, WithJsonSchema({'description': '自定义回调参数；任务完成时会通过事件回调原样返回，用于关联业务；字段长度最大为 512 字节。 仅在用户明确提供该值时传递；不得由 Agent 生成、推断或补写。', 'type': 'string'})] = Field(None),
        callback_url: Annotated[str | None, WithJsonSchema({'description': '用于接收该任务结果回调的 URL 地址；提供后优先级高于全局回调地址；地址必须以 http:// 或 https:// 开头。 仅在用户明确提供该值时传递；不得由 Agent 生成、推断或补写。', 'type': 'string'})] = Field(None),
        client_token: Annotated[str | None, WithJsonSchema({'description': '用户请求凭证，用于幂等控制；大小写敏感，长度不超过 64 个 ASCII 可打印字符。 默认不传。用户明确指定时原样使用；用户明确要求重试时，同一逻辑请求的重试链必须复用同一 token。已有 token 时必须复用原值；此前请求未带 token 时，可从本次重试开始创建一次并持续复用，但该 token 不对此前请求提供追溯幂等。业务参数变化视为新请求，不得复用旧 token。不得为每次尝试生成不同值。调用端运行时不判断重试意图，也不自动生成 token。', 'type': 'string'})] = Field(None),
        filter_style: Annotated[str | None, WithJsonSchema({'default': 'spring', 'description': '滤镜风格，必须选择 spring、sunset、vivid、fair_skin、food 之一；默认 spring（春日滤镜）。spring 表示春日滤镜，sunset 表示晚霞滤镜，vivid 表示鲜亮滤镜，fair_skin 表示白皙滤镜，food 表示食物滤镜。', 'enum': ['spring', 'sunset', 'vivid', 'fair_skin', 'food'], 'type': 'string'})] = Field(None, json_schema_extra={'default': 'spring'}),
        media_output_destination: Annotated[str | None, WithJsonSchema({'description': '指定处理产物的目标存储位置；支持将处理产物存储至火山引擎视频点播（VOD）空间或对象存储（TOS）桶。存储至 VOD 时设为 `vod://<您的空间名>`，存储至 TOS 时设为 `tos://<您的桶名>`。设置后，任务结果中的 `url` 相关字段返回 `vod://` 或 `tos://` 格式的资源地址，不再返回临时下载地址。首次使用前需按需授权 AI MediaKit 将文件写入您的 VOD 空间或 TOS 桶。 仅在用户明确提供该值时传递；不得由 Agent 生成、推断或补写。', 'type': 'string'})] = Field(None),
        queue_id: Annotated[str | None, WithJsonSchema({'description': '任务提交的目标队列 ID；不传时默认使用系统自动创建的队列 ID。可将不同业务或优先级的任务提交到不同队列，以按队列对应的项目进行分账。队列可创建和管理，系统会自动分配队列 ID。 仅在用户明确提供该值时传递；不得由 Agent 生成、推断或补写。', 'type': 'string'})] = Field(None),
    ) -> dict:
        try:
            result = get_client().call('apply_video_filter', **{
                key: item for key, item in {'video_url': video_url, 'callback_args': callback_args, 'callback_url': callback_url, 'client_token': client_token, 'filter_style': filter_style, 'media_output_destination': media_output_destination, 'queue_id': queue_id}.items()
                if item is not None
            })
            return async_task_response(result)
        except Exception as exc:
            return error_response(_structured_error(exc))

    @mcp.tool(name='concat_audio', description='拼接多个音频片段。')
    async def concat_audio(
        audio_urls: Annotated[list[Any], WithJsonSchema({'description': '待拼接的音频 URL 列表；单次任务最少传入 1 个 URL，最多传入 100 个 URL；支持 mp3、m4a、wav 等主流音频格式；音频来源支持公网 HTTP/HTTPS URL、火山引擎视频点播 vod:// 和火山引擎对象存储 tos:// 三种输入协议；建议单个输入文件大小不超过 10 GB。', 'items': {'description': '待拼接的输入音频。String 类型，支持http://xxx或https://xxx格式 URL', 'format': 'media-to-url', 'type': 'string'}, 'maxItems': 100, 'minItems': 1, 'type': 'array'})] = Field(...),
        callback_args: Annotated[str | None, WithJsonSchema({'description': '自定义回调参数；任务完成时会通过事件回调原样返回，用于关联业务；字段长度最大为 512 字节。 仅在用户明确提供该值时传递；不得由 Agent 生成、推断或补写。', 'type': 'string'})] = Field(None),
        callback_url: Annotated[str | None, WithJsonSchema({'description': '用于接收该任务结果回调的 URL 地址；提供后优先级高于全局回调地址；地址必须以 http:// 或 https:// 开头。 仅在用户明确提供该值时传递；不得由 Agent 生成、推断或补写。', 'type': 'string'})] = Field(None),
        client_token: Annotated[str | None, WithJsonSchema({'description': '用户请求凭证，用于幂等控制；大小写敏感，长度不超过 64 个 ASCII 可打印字符。 默认不传。用户明确指定时原样使用；用户明确要求重试时，同一逻辑请求的重试链必须复用同一 token。已有 token 时必须复用原值；此前请求未带 token 时，可从本次重试开始创建一次并持续复用，但该 token 不对此前请求提供追溯幂等。业务参数变化视为新请求，不得复用旧 token。不得为每次尝试生成不同值。调用端运行时不判断重试意图，也不自动生成 token。', 'type': 'string'})] = Field(None),
        format: Annotated[str | None, WithJsonSchema({'default': 'm4a', 'description': '输出音频格式支持 mp3、m4a、ogg、flac、wav；默认值为 m4a。', 'enum': ['mp3', 'm4a', 'ogg', 'flac', 'wav'], 'type': 'string'})] = Field(None, json_schema_extra={'default': 'm4a'}),
        media_output_destination: Annotated[str | None, WithJsonSchema({'description': '指定处理产物的目标存储位置；支持将处理产物存储至火山引擎视频点播（VOD）空间或对象存储（TOS）桶。存储至 VOD 时设为 `vod://<您的空间名>`，存储至 TOS 时设为 `tos://<您的桶名>`。设置后，任务结果中的 `url` 相关字段返回 `vod://` 或 `tos://` 格式的资源地址，不再返回临时下载地址。首次使用前需按需授权 AI MediaKit 将文件写入您的 VOD 空间或 TOS 桶。 仅在用户明确提供该值时传递；不得由 Agent 生成、推断或补写。', 'type': 'string'})] = Field(None),
        queue_id: Annotated[str | None, WithJsonSchema({'description': '任务提交的目标队列 ID；不传时默认使用系统自动创建的队列 ID。可将不同业务或优先级的任务提交到不同队列，以按队列对应的项目进行分账。队列可创建和管理，系统会自动分配队列 ID。 仅在用户明确提供该值时传递；不得由 Agent 生成、推断或补写。', 'type': 'string'})] = Field(None),
    ) -> dict:
        try:
            result = get_client().call('concat_audio', **{
                key: item for key, item in {'audio_urls': audio_urls, 'callback_args': callback_args, 'callback_url': callback_url, 'client_token': client_token, 'format': format, 'media_output_destination': media_output_destination, 'queue_id': queue_id}.items()
                if item is not None
            })
            return async_task_response(result)
        except Exception as exc:
            return error_response(_structured_error(exc))

    @mcp.tool(name='concat_video', description='将多个视频按顺序拼接成一个完整的视频文件，并支持在拼接处添加转场效果。')
    async def concat_video(
        video_urls: Annotated[list[Any], WithJsonSchema({'description': '待拼接的视频 URL 列表，单次任务支持传入 1 到 100 个 URL；建议单个输入文件大小不超过 10 GB；输入视频最高支持 4K (3840×2160) 分辨率；支持公网 HTTP/HTTPS URL、火山引擎视频点播 (vod://) 和火山引擎对象存储 (tos://) 三种输入协议；支持 mp4、flv、ts、avi、mov、wmv、mkv 等主流视频格式。当输入多个分辨率不一致的视频时，输出视频的分辨率以列表中第一个视频为基准。', 'items': {'description': '待拼接的输入视频。String 类型，支持http://xxx或https://xxx格式 URL', 'format': 'media-to-url', 'type': 'string'}, 'maxItems': 100, 'minItems': 1, 'type': 'array'})] = Field(...),
        callback_args: Annotated[str | None, WithJsonSchema({'description': '自定义回调参数；任务完成时会通过事件回调原样返回，用于关联业务；字段长度最大为 512 字节。 仅在用户明确提供该值时传递；不得由 Agent 生成、推断或补写。', 'type': 'string'})] = Field(None),
        callback_url: Annotated[str | None, WithJsonSchema({'description': '用于接收该任务结果回调的 URL 地址；提供后优先级高于全局回调地址；地址必须以 http:// 或 https:// 开头。 仅在用户明确提供该值时传递；不得由 Agent 生成、推断或补写。', 'type': 'string'})] = Field(None),
        client_token: Annotated[str | None, WithJsonSchema({'description': '用户请求凭证，用于幂等控制；大小写敏感，长度不超过 64 个 ASCII 可打印字符。 默认不传。用户明确指定时原样使用；用户明确要求重试时，同一逻辑请求的重试链必须复用同一 token。已有 token 时必须复用原值；此前请求未带 token 时，可从本次重试开始创建一次并持续复用，但该 token 不对此前请求提供追溯幂等。业务参数变化视为新请求，不得复用旧 token。不得为每次尝试生成不同值。调用端运行时不判断重试意图，也不自动生成 token。', 'type': 'string'})] = Field(None),
        media_output_destination: Annotated[str | None, WithJsonSchema({'description': '指定处理产物的目标存储位置；支持将处理产物存储至火山引擎视频点播（VOD）空间或对象存储（TOS）桶。存储至 VOD 时设为 `vod://<您的空间名>`，存储至 TOS 时设为 `tos://<您的桶名>`。设置后，任务结果中的 `url` 相关字段返回 `vod://` 或 `tos://` 格式的资源地址，不再返回临时下载地址。首次使用前需按需授权 AI MediaKit 将文件写入您的 VOD 空间或 TOS 桶。 仅在用户明确提供该值时传递；不得由 Agent 生成、推断或补写。', 'type': 'string'})] = Field(None),
        queue_id: Annotated[str | None, WithJsonSchema({'description': '任务提交的目标队列 ID；不传时默认使用系统自动创建的队列 ID。可将不同业务或优先级的任务提交到不同队列，以按队列对应的项目进行分账。队列可创建和管理，系统会自动分配队列 ID。 仅在用户明确提供该值时传递；不得由 Agent 生成、推断或补写。', 'type': 'string'})] = Field(None),
        transitions: Annotated[list[Any] | None, WithJsonSchema({'description': '视频间的转场效果 ID 列表；默认无转场（硬切）。当视频数量超过转场数量 2 个及以上时，系统将自动循环使用转场。', 'items': {'description': '转场效果 ID\n分类：交替出场，ID：1182359\n分类：旋转放大，ID：1182360\n分类：泛开，ID：1182358\n分类：六角形，ID：1182365\n分类：故障转换，ID：1182367\n分类：飞眼，ID：1182368\n分类：梦幻放大，ID：1182369\n分类：开门展现，ID：1182370\n分类：立方转换，ID：1182373\n分类：透镜变换，ID：1182374\n分类：晚霞转场，ID：1182375\n分类：圆形交替，ID：1182378\n', 'enum': ['1182359', '1182360', '1182358', '1182365', '1182367', '1182368', '1182369', '1182370', '1182373', '1182374', '1182375', '1182378'], 'type': 'string'}, 'type': 'array'})] = Field(None),
    ) -> dict:
        try:
            result = get_client().call('concat_video', **{
                key: item for key, item in {'video_urls': video_urls, 'callback_args': callback_args, 'callback_url': callback_url, 'client_token': client_token, 'media_output_destination': media_output_destination, 'queue_id': queue_id, 'transitions': transitions}.items()
                if item is not None
            })
            return async_task_response(result)
        except Exception as exc:
            return error_response(_structured_error(exc))

    @mcp.tool(name='crop_video', description='按指定的矩形区域裁剪视频画面，裁剪结果仅保留指定的需要区域。')
    async def crop_video(
        bottom_right_x: Annotated[int, WithJsonSchema({'description': '裁剪矩形右下角的 X 坐标，单位为像素。bottom_right_x 必须大于 top_left_x，且 bottom_right_x 与 top_left_x 的差值不得小于 16px。建议裁剪矩形不要超出原始画面边界；当 bottom_right_x 超过视频宽度或 bottom_right_y 超过视频高度时，裁剪结果的相应维度会截断至画面边界。', 'minimum': 1, 'type': 'integer'})] = Field(...),
        bottom_right_y: Annotated[int, WithJsonSchema({'description': '裁剪矩形右下角的 Y 坐标，单位为像素。bottom_right_y 必须大于 top_left_y，且 bottom_right_y 与 top_left_y 的差值不得小于 16px。建议裁剪矩形不要超出原始画面边界；当 bottom_right_x 超过视频宽度或 bottom_right_y 超过视频高度时，裁剪结果的相应维度会截断至画面边界。', 'minimum': 1, 'type': 'integer'})] = Field(...),
        top_left_x: Annotated[int, WithJsonSchema({'description': 'top_left_x 是裁剪矩形左上角的水平方向 X 坐标，单位为像素。top_left_x 必须为非负整数。', 'minimum': 0, 'type': 'integer'})] = Field(...),
        top_left_y: Annotated[int, WithJsonSchema({'description': 'top_left_y 是裁剪矩形左上角的垂直方向 Y 坐标，单位为像素。top_left_y 必须为非负整数。', 'minimum': 0, 'type': 'integer'})] = Field(...),
        video_url: Annotated[str, WithJsonSchema({'description': '待裁剪视频的 URL。支持 mp4、flv、ts、avi、mov、wmv、mkv 等主流视频格式；支持公网 HTTP/HTTPS、火山引擎视频点播 vod:// 和对象存储 tos:// 三种输入协议。输入视频最高支持 4K（3840×2160）分辨率，建议输入文件大小不超过 10 GB。', 'format': 'media-to-vid', 'type': 'string'})] = Field(...),
        callback_args: Annotated[str | None, WithJsonSchema({'description': '自定义回调参数；任务完成时会通过事件回调原样返回，用于关联业务；字段长度最大为 512 字节。 仅在用户明确提供该值时传递；不得由 Agent 生成、推断或补写。', 'type': 'string'})] = Field(None),
        callback_url: Annotated[str | None, WithJsonSchema({'description': '用于接收该任务结果回调的 URL 地址；提供后优先级高于全局回调地址；地址必须以 http:// 或 https:// 开头。 仅在用户明确提供该值时传递；不得由 Agent 生成、推断或补写。', 'type': 'string'})] = Field(None),
        client_token: Annotated[str | None, WithJsonSchema({'description': '用户请求凭证，用于幂等控制；大小写敏感，长度不超过 64 个 ASCII 可打印字符。 默认不传。用户明确指定时原样使用；用户明确要求重试时，同一逻辑请求的重试链必须复用同一 token。已有 token 时必须复用原值；此前请求未带 token 时，可从本次重试开始创建一次并持续复用，但该 token 不对此前请求提供追溯幂等。业务参数变化视为新请求，不得复用旧 token。不得为每次尝试生成不同值。调用端运行时不判断重试意图，也不自动生成 token。', 'type': 'string'})] = Field(None),
        media_output_destination: Annotated[str | None, WithJsonSchema({'description': '指定处理产物的目标存储位置；支持将处理产物存储至火山引擎视频点播（VOD）空间或对象存储（TOS）桶。存储至 VOD 时设为 `vod://<您的空间名>`，存储至 TOS 时设为 `tos://<您的桶名>`。设置后，任务结果中的 `url` 相关字段返回 `vod://` 或 `tos://` 格式的资源地址，不再返回临时下载地址。首次使用前需按需授权 AI MediaKit 将文件写入您的 VOD 空间或 TOS 桶。 仅在用户明确提供该值时传递；不得由 Agent 生成、推断或补写。', 'type': 'string'})] = Field(None),
        queue_id: Annotated[str | None, WithJsonSchema({'description': '任务提交的目标队列 ID；不传时默认使用系统自动创建的队列 ID。可将不同业务或优先级的任务提交到不同队列，以按队列对应的项目进行分账。队列可创建和管理，系统会自动分配队列 ID。 仅在用户明确提供该值时传递；不得由 Agent 生成、推断或补写。', 'type': 'string'})] = Field(None),
    ) -> dict:
        try:
            result = get_client().call('crop_video', **{
                key: item for key, item in {'bottom_right_x': bottom_right_x, 'bottom_right_y': bottom_right_y, 'top_left_x': top_left_x, 'top_left_y': top_left_y, 'video_url': video_url, 'callback_args': callback_args, 'callback_url': callback_url, 'client_token': client_token, 'media_output_destination': media_output_destination, 'queue_id': queue_id}.items()
                if item is not None
            })
            return async_task_response(result)
        except Exception as exc:
            return error_response(_structured_error(exc))

    @mcp.tool(name='extract_animated_image', description='从视频中按指定开始时间和结束时间截取一段画面，生成 GIF 或 WebP 动图，常用于制作封面动图、营销素材和短预览。')
    async def extract_animated_image(
        end_time: Annotated[float, WithJsonSchema({'description': 'end_time 表示截取片段的结束时间，单位为秒；end_time 必须大于 start_time；输出动图的时长最大为 60 秒；end_time 支持最多 3 位小数。', 'minimum': 0, 'type': 'number'})] = Field(...),
        start_time: Annotated[float, WithJsonSchema({'default': 0, 'description': 'start_time 表示截取片段的开始时间，单位为秒；start_time 默认为 0，表示从视频开头截取；start_time 支持最多 3 位小数。', 'minimum': 0, 'type': 'number'})] = Field(...),
        video_url: Annotated[str, WithJsonSchema({'description': 'video_url 指定待截取动图的视频 URL；video_url 支持公网 HTTP/HTTPS URL、火山引擎视频点播 vod:// 和火山引擎对象存储 tos:// 三种输入协议；输入视频支持 mp4、flv、ts、avi、mov、wmv、mkv 等格式，最高支持 4K（3840×2160）分辨率。', 'format': 'media-to-vid', 'type': 'string'})] = Field(...),
        callback_args: Annotated[str | None, WithJsonSchema({'description': '自定义回调参数；任务完成时会通过事件回调原样返回，用于关联业务；字段长度最大为 512 字节。 仅在用户明确提供该值时传递；不得由 Agent 生成、推断或补写。', 'type': 'string'})] = Field(None),
        callback_url: Annotated[str | None, WithJsonSchema({'description': '用于接收该任务结果回调的 URL 地址；提供后优先级高于全局回调地址；地址必须以 http:// 或 https:// 开头。 仅在用户明确提供该值时传递；不得由 Agent 生成、推断或补写。', 'type': 'string'})] = Field(None),
        client_token: Annotated[str | None, WithJsonSchema({'description': '用户请求凭证，用于幂等控制；大小写敏感，长度不超过 64 个 ASCII 可打印字符。 默认不传。用户明确指定时原样使用；用户明确要求重试时，同一逻辑请求的重试链必须复用同一 token。已有 token 时必须复用原值；此前请求未带 token 时，可从本次重试开始创建一次并持续复用，但该 token 不对此前请求提供追溯幂等。业务参数变化视为新请求，不得复用旧 token。不得为每次尝试生成不同值。调用端运行时不判断重试意图，也不自动生成 token。', 'type': 'string'})] = Field(None),
        media_output_destination: Annotated[str | None, WithJsonSchema({'description': '指定处理产物的目标存储位置；支持将处理产物存储至对象存储（TOS）桶，格式为 `tos://<您的桶名>`。设置后，任务结果中的 `url` 相关字段返回 `tos://` 格式的资源地址，不再返回临时下载地址。首次使用前需授权 AI MediaKit 将文件写入您的 TOS 桶。 仅在用户明确提供该值时传递；不得由 Agent 生成、推断或补写。', 'type': 'string'})] = Field(None),
        output_format: Annotated[str | None, WithJsonSchema({'default': 'gif', 'description': 'output_format 支持 gif 和 webp，默认值为 gif。', 'enum': ['gif', 'webp'], 'type': 'string'})] = Field(None, json_schema_extra={'default': 'gif'}),
        queue_id: Annotated[str | None, WithJsonSchema({'description': '任务提交的目标队列 ID；不传时默认使用系统自动创建的队列 ID。可将不同业务或优先级的任务提交到不同队列，以按队列对应的项目进行分账。队列可创建和管理，系统会自动分配队列 ID。 仅在用户明确提供该值时传递；不得由 Agent 生成、推断或补写。', 'type': 'string'})] = Field(None),
    ) -> dict:
        try:
            result = get_client().call('extract_animated_image', **{
                key: item for key, item in {'end_time': end_time, 'start_time': start_time, 'video_url': video_url, 'callback_args': callback_args, 'callback_url': callback_url, 'client_token': client_token, 'media_output_destination': media_output_destination, 'output_format': output_format, 'queue_id': queue_id}.items()
                if item is not None
            })
            return async_task_response(result)
        except Exception as exc:
            return error_response(_structured_error(exc))

    @mcp.tool(name='extract_audio', description='从输入视频文件中分离音轨，生成独立的音频文件。')
    async def extract_audio(
        video_url: Annotated[str, WithJsonSchema({'description': '待提取音频的视频 URL，支持公网 HTTP/HTTPS URL、火山引擎视频点播 vod://、火山引擎对象存储 tos:// 三种输入协议；建议单个输入文件大小不超过 10 GB；输入视频最高支持 4K (3840×2160) 分辨率；支持 mp4、flv、ts、avi、mov、wmv、mkv 等主流视频格式。', 'format': 'media-to-url', 'type': 'string'})] = Field(...),
        callback_args: Annotated[str | None, WithJsonSchema({'description': '自定义回调参数；任务完成时会通过事件回调原样返回，用于关联业务；字段长度最大为 512 字节。 仅在用户明确提供该值时传递；不得由 Agent 生成、推断或补写。', 'type': 'string'})] = Field(None),
        callback_url: Annotated[str | None, WithJsonSchema({'description': '用于接收该任务结果回调的 URL 地址；提供后优先级高于全局回调地址；地址必须以 http:// 或 https:// 开头。 仅在用户明确提供该值时传递；不得由 Agent 生成、推断或补写。', 'type': 'string'})] = Field(None),
        client_token: Annotated[str | None, WithJsonSchema({'description': '用户请求凭证，用于幂等控制；大小写敏感，长度不超过 64 个 ASCII 可打印字符。 默认不传。用户明确指定时原样使用；用户明确要求重试时，同一逻辑请求的重试链必须复用同一 token。已有 token 时必须复用原值；此前请求未带 token 时，可从本次重试开始创建一次并持续复用，但该 token 不对此前请求提供追溯幂等。业务参数变化视为新请求，不得复用旧 token。不得为每次尝试生成不同值。调用端运行时不判断重试意图，也不自动生成 token。', 'type': 'string'})] = Field(None),
        format: Annotated[str | None, WithJsonSchema({'default': 'm4a', 'description': '输出音频格式支持 mp3、m4a、ogg、flac、wav，默认值为 m4a。', 'enum': ['mp3', 'm4a', 'ogg', 'flac', 'wav'], 'type': 'string'})] = Field(None, json_schema_extra={'default': 'm4a'}),
        media_output_destination: Annotated[str | None, WithJsonSchema({'description': '指定处理产物的目标存储位置；支持将处理产物存储至火山引擎视频点播（VOD）空间或对象存储（TOS）桶。存储至 VOD 时设为 `vod://<您的空间名>`，存储至 TOS 时设为 `tos://<您的桶名>`。设置后，任务结果中的 `url` 相关字段返回 `vod://` 或 `tos://` 格式的资源地址，不再返回临时下载地址。首次使用前需按需授权 AI MediaKit 将文件写入您的 VOD 空间或 TOS 桶。 仅在用户明确提供该值时传递；不得由 Agent 生成、推断或补写。', 'type': 'string'})] = Field(None),
        queue_id: Annotated[str | None, WithJsonSchema({'description': '任务提交的目标队列 ID；不传时默认使用系统自动创建的队列 ID。可将不同业务或优先级的任务提交到不同队列，以按队列对应的项目进行分账。队列可创建和管理，系统会自动分配队列 ID。 仅在用户明确提供该值时传递；不得由 Agent 生成、推断或补写。', 'type': 'string'})] = Field(None),
    ) -> dict:
        try:
            result = get_client().call('extract_audio', **{
                key: item for key, item in {'video_url': video_url, 'callback_args': callback_args, 'callback_url': callback_url, 'client_token': client_token, 'format': format, 'media_output_destination': media_output_destination, 'queue_id': queue_id}.items()
                if item is not None
            })
            return async_task_response(result)
        except Exception as exc:
            return error_response(_structured_error(exc))

    @mcp.tool(name='fade_audio', description='对输入音频的起止位置实现淡入或淡出效果，输出处理后的音频文件。')
    async def fade_audio(
        audio_url: Annotated[str, WithJsonSchema({'description': '输入音频，支持 mp3、m4a、wav 等主流音频格式；支持公网 HTTP/HTTPS URL、火山引擎视频点播 vod:// 和火山引擎对象存储 tos:// 三种输入协议；建议单个输入文件大小不超过 10 GB。', 'format': 'media-to-vid', 'type': 'string'})] = Field(...),
        callback_args: Annotated[str | None, WithJsonSchema({'description': '自定义回调参数；任务完成时会通过事件回调原样返回，用于关联业务；字段长度最大为 512 字节。 仅在用户明确提供该值时传递；不得由 Agent 生成、推断或补写。', 'type': 'string'})] = Field(None),
        callback_url: Annotated[str | None, WithJsonSchema({'description': '用于接收该任务结果回调的 URL 地址；提供后优先级高于全局回调地址；地址必须以 http:// 或 https:// 开头。 仅在用户明确提供该值时传递；不得由 Agent 生成、推断或补写。', 'type': 'string'})] = Field(None),
        client_token: Annotated[str | None, WithJsonSchema({'description': '用户请求凭证，用于幂等控制；大小写敏感，长度不超过 64 个 ASCII 可打印字符。 默认不传。用户明确指定时原样使用；用户明确要求重试时，同一逻辑请求的重试链必须复用同一 token。已有 token 时必须复用原值；此前请求未带 token 时，可从本次重试开始创建一次并持续复用，但该 token 不对此前请求提供追溯幂等。业务参数变化视为新请求，不得复用旧 token。不得为每次尝试生成不同值。调用端运行时不判断重试意图，也不自动生成 token。', 'type': 'string'})] = Field(None),
        fade_in_duration: Annotated[float | None, WithJsonSchema({'default': 1, 'description': '声音淡入时长，单位为秒，支持最多 3 位小数，默认值为 1；为 0 或不填时不执行淡入操作。', 'minimum': 0, 'type': 'number'})] = Field(None, json_schema_extra={'default': 1}),
        fade_out_duration: Annotated[float | None, WithJsonSchema({'default': 1, 'description': '声音淡出时长，单位为秒，支持最多 3 位小数，默认值为 1；为 0 或不填时不执行淡出操作。', 'minimum': 0, 'type': 'number'})] = Field(None, json_schema_extra={'default': 1}),
        format: Annotated[str | None, WithJsonSchema({'default': 'mp3', 'description': '输出音频格式，支持 mp3、m4a、ogg、flac、wav。', 'enum': ['mp3', 'm4a', 'ogg', 'flac', 'wav'], 'type': 'string'})] = Field(None, json_schema_extra={'default': 'mp3'}),
        media_output_destination: Annotated[str | None, WithJsonSchema({'description': '指定处理产物的目标存储位置；支持将处理产物存储至火山引擎视频点播（VOD）空间或对象存储（TOS）桶。存储至 VOD 时设为 `vod://<您的空间名>`，存储至 TOS 时设为 `tos://<您的桶名>`。设置后，任务结果中的 `url` 相关字段返回 `vod://` 或 `tos://` 格式的资源地址，不再返回临时下载地址。首次使用前需按需授权 AI MediaKit 将文件写入您的 VOD 空间或 TOS 桶。 仅在用户明确提供该值时传递；不得由 Agent 生成、推断或补写。', 'type': 'string'})] = Field(None),
        queue_id: Annotated[str | None, WithJsonSchema({'description': '任务提交的目标队列 ID；不传时默认使用系统自动创建的队列 ID。可将不同业务或优先级的任务提交到不同队列，以按队列对应的项目进行分账。队列可创建和管理，系统会自动分配队列 ID。 仅在用户明确提供该值时传递；不得由 Agent 生成、推断或补写。', 'type': 'string'})] = Field(None),
    ) -> dict:
        try:
            result = get_client().call('fade_audio', **{
                key: item for key, item in {'audio_url': audio_url, 'callback_args': callback_args, 'callback_url': callback_url, 'client_token': client_token, 'fade_in_duration': fade_in_duration, 'fade_out_duration': fade_out_duration, 'format': format, 'media_output_destination': media_output_destination, 'queue_id': queue_id}.items()
                if item is not None
            })
            return async_task_response(result)
        except Exception as exc:
            return error_response(_structured_error(exc))

    @mcp.tool(name='fade_video_audio', description='在片头或片尾对输入视频音轨执行淡入或淡出处理，用于弱化音轨突兀的起止，提升成片听感。输出处理后的视频文件。')
    async def fade_video_audio(
        video_url: Annotated[str, WithJsonSchema({'description': '待处理的视频 URL。支持公网 HTTP/HTTPS URL、火山引擎视频点播 vod:// 和火山引擎对象存储 tos:// 三种输入协议；支持 mp4、flv、ts、avi、mov、wmv、mkv 等主流视频格式；最高支持 4K（3840×2160）分辨率；建议单个输入文件大小不超过 10 GB。', 'format': 'media-to-vid', 'type': 'string'})] = Field(...),
        callback_args: Annotated[str | None, WithJsonSchema({'description': '自定义回调参数；任务完成时会通过事件回调原样返回，用于关联业务；字段长度最大为 512 字节。 仅在用户明确提供该值时传递；不得由 Agent 生成、推断或补写。', 'type': 'string'})] = Field(None),
        callback_url: Annotated[str | None, WithJsonSchema({'description': '用于接收该任务结果回调的 URL 地址；提供后优先级高于全局回调地址；地址必须以 http:// 或 https:// 开头。 仅在用户明确提供该值时传递；不得由 Agent 生成、推断或补写。', 'type': 'string'})] = Field(None),
        client_token: Annotated[str | None, WithJsonSchema({'description': '用户请求凭证，用于幂等控制；大小写敏感，长度不超过 64 个 ASCII 可打印字符。 默认不传。用户明确指定时原样使用；用户明确要求重试时，同一逻辑请求的重试链必须复用同一 token。已有 token 时必须复用原值；此前请求未带 token 时，可从本次重试开始创建一次并持续复用，但该 token 不对此前请求提供追溯幂等。业务参数变化视为新请求，不得复用旧 token。不得为每次尝试生成不同值。调用端运行时不判断重试意图，也不自动生成 token。', 'type': 'string'})] = Field(None),
        fade_in_duration: Annotated[float | None, WithJsonSchema({'default': 1, 'description': '声音淡入时长，单位为秒，默认值为 1，支持最多 3 位小数；取 0 时不执行淡入操作。', 'minimum': 0, 'type': 'number'})] = Field(None, json_schema_extra={'default': 1}),
        fade_out_duration: Annotated[float | None, WithJsonSchema({'default': 1, 'description': '声音淡出时长，单位为秒，默认值为 1，支持最多 3 位小数；取 0 时不执行淡出操作。', 'minimum': 0, 'type': 'number'})] = Field(None, json_schema_extra={'default': 1}),
        media_output_destination: Annotated[str | None, WithJsonSchema({'description': '指定处理产物的目标存储位置；支持将处理产物存储至火山引擎视频点播（VOD）空间或对象存储（TOS）桶。存储至 VOD 时设为 `vod://<您的空间名>`，存储至 TOS 时设为 `tos://<您的桶名>`。设置后，任务结果中的 `url` 相关字段返回 `vod://` 或 `tos://` 格式的资源地址，不再返回临时下载地址。首次使用前需按需授权 AI MediaKit 将文件写入您的 VOD 空间或 TOS 桶。 仅在用户明确提供该值时传递；不得由 Agent 生成、推断或补写。', 'type': 'string'})] = Field(None),
        queue_id: Annotated[str | None, WithJsonSchema({'description': '任务提交的目标队列 ID；不传时默认使用系统自动创建的队列 ID。可将不同业务或优先级的任务提交到不同队列，以按队列对应的项目进行分账。队列可创建和管理，系统会自动分配队列 ID。 仅在用户明确提供该值时传递；不得由 Agent 生成、推断或补写。', 'type': 'string'})] = Field(None),
    ) -> dict:
        try:
            result = get_client().call('fade_video_audio', **{
                key: item for key, item in {'video_url': video_url, 'callback_args': callback_args, 'callback_url': callback_url, 'client_token': client_token, 'fade_in_duration': fade_in_duration, 'fade_out_duration': fade_out_duration, 'media_output_destination': media_output_destination, 'queue_id': queue_id}.items()
                if item is not None
            })
            return async_task_response(result)
        except Exception as exc:
            return error_response(_structured_error(exc))

    @mcp.tool(name='flip_video', description='用于视频画面翻转，对指定视频进行上下或左右镜像翻转。')
    async def flip_video(
        video_url: Annotated[str, WithJsonSchema({'description': '待翻转的视频 URL，支持公网 HTTP/HTTPS URL、火山引擎视频点播 (vod://) 和火山引擎对象存储 (tos://) 三种输入协议；支持 mp4、flv、ts、avi、mov、wmv、mkv 等主流视频格式；最高支持 4K (3840×2160) 分辨率；建议输入文件大小不超过 10 GB。', 'format': 'media-to-url', 'type': 'string'})] = Field(...),
        callback_args: Annotated[str | None, WithJsonSchema({'description': '自定义回调参数；任务完成时会通过事件回调原样返回，用于关联业务；字段长度最大为 512 字节。 仅在用户明确提供该值时传递；不得由 Agent 生成、推断或补写。', 'type': 'string'})] = Field(None),
        callback_url: Annotated[str | None, WithJsonSchema({'description': '用于接收该任务结果回调的 URL 地址；提供后优先级高于全局回调地址；地址必须以 http:// 或 https:// 开头。 仅在用户明确提供该值时传递；不得由 Agent 生成、推断或补写。', 'type': 'string'})] = Field(None),
        client_token: Annotated[str | None, WithJsonSchema({'description': '用户请求凭证，用于幂等控制；大小写敏感，长度不超过 64 个 ASCII 可打印字符。 默认不传。用户明确指定时原样使用；用户明确要求重试时，同一逻辑请求的重试链必须复用同一 token。已有 token 时必须复用原值；此前请求未带 token 时，可从本次重试开始创建一次并持续复用，但该 token 不对此前请求提供追溯幂等。业务参数变化视为新请求，不得复用旧 token。不得为每次尝试生成不同值。调用端运行时不判断重试意图，也不自动生成 token。', 'type': 'string'})] = Field(None),
        is_flip_horizontal: Annotated[bool | None, WithJsonSchema({'default': False, 'description': '可省略，用于控制是否进行水平（左右）翻转，默认值为 false。', 'type': 'boolean'})] = Field(None, json_schema_extra={'default': False}),
        is_flip_vertical: Annotated[bool | None, WithJsonSchema({'default': False, 'description': '可省略，用于控制是否进行垂直（上下）翻转，默认值为 false。is_flip_vertical 和 is_flip_horizontal 两个参数至少需要将其中一个设置为 true，否则处理后的视频与原视频没有区别；如果两个参数都设置为 true，效果等同于将画面旋转 180 度。', 'type': 'boolean'})] = Field(None, json_schema_extra={'default': False}),
        media_output_destination: Annotated[str | None, WithJsonSchema({'description': '指定处理产物的目标存储位置；支持将处理产物存储至火山引擎视频点播（VOD）空间或对象存储（TOS）桶。存储至 VOD 时设为 `vod://<您的空间名>`，存储至 TOS 时设为 `tos://<您的桶名>`。设置后，任务结果中的 `url` 相关字段返回 `vod://` 或 `tos://` 格式的资源地址，不再返回临时下载地址。首次使用前需按需授权 AI MediaKit 将文件写入您的 VOD 空间或 TOS 桶。 仅在用户明确提供该值时传递；不得由 Agent 生成、推断或补写。', 'type': 'string'})] = Field(None),
        queue_id: Annotated[str | None, WithJsonSchema({'description': '任务提交的目标队列 ID；不传时默认使用系统自动创建的队列 ID。可将不同业务或优先级的任务提交到不同队列，以按队列对应的项目进行分账。队列可创建和管理，系统会自动分配队列 ID。 仅在用户明确提供该值时传递；不得由 Agent 生成、推断或补写。', 'type': 'string'})] = Field(None),
    ) -> dict:
        try:
            result = get_client().call('flip_video', **{
                key: item for key, item in {'video_url': video_url, 'callback_args': callback_args, 'callback_url': callback_url, 'client_token': client_token, 'is_flip_horizontal': is_flip_horizontal, 'is_flip_vertical': is_flip_vertical, 'media_output_destination': media_output_destination, 'queue_id': queue_id}.items()
                if item is not None
            })
            return async_task_response(result)
        except Exception as exc:
            return error_response(_structured_error(exc))

    @mcp.tool(name='image_to_video', description='将多张图片按顺序组合成动态视频，可配置转场动画和镜头内动画；仅把现有图片做成带动效的视频，不支持根据参考图生成新的画面内容。')
    async def image_to_video(
        images: Annotated[list[Any], WithJsonSchema({'description': '图片对象列表，用于定义视频的每一帧内容；单次任务支持最少 1 个、最多 100 个图片对象。', 'items': {'description': '待合成的图片。Image类型', 'properties': {'animation_in': {'description': '仅在设置了 animation_type 后生效；动画开始时间点相对于该图片片段的起始，单位：秒；默认值为 0，表示动画从图片展示的第一帧开始。', 'type': 'number'}, 'animation_out': {'description': '仅在设置了 animation_type 后生效；动画结束时间点相对于该图片片段的起始，单位：秒；默认值为图片的 duration 值，表示动画在图片展示的最后一帧结束。', 'type': 'number'}, 'animation_type': {'description': '图片展示期间的镜头内动画类型；默认无动画；可使用 move_up、move_down、move_left、move_right、zoom_in、zoom_out。', 'type': 'string'}, 'duration': {'description': '图片展示时长，单位：秒；默认值为 3；支持最多两位小数。', 'type': 'number'}, 'image_url': {'description': '图片的 URL；支持公网 HTTP/HTTPS URL、对象存储 tos:// 两种输入协议；支持 jpg、png 等主流静态图片格式。', 'format': 'media-to-url', 'type': 'string'}}, 'required': ['image_url'], 'type': 'object'}, 'maxItems': 100, 'minItems': 1, 'type': 'array'})] = Field(...),
        callback_args: Annotated[str | None, WithJsonSchema({'description': '自定义回调参数；任务完成时会通过事件回调原样返回，用于关联业务；字段长度最大为 512 字节。 仅在用户明确提供该值时传递；不得由 Agent 生成、推断或补写。', 'type': 'string'})] = Field(None),
        callback_url: Annotated[str | None, WithJsonSchema({'description': '用于接收该任务结果回调的 URL 地址；提供后优先级高于全局回调地址；地址必须以 http:// 或 https:// 开头。 仅在用户明确提供该值时传递；不得由 Agent 生成、推断或补写。', 'type': 'string'})] = Field(None),
        client_token: Annotated[str | None, WithJsonSchema({'description': '用户请求凭证，用于幂等控制；大小写敏感，长度不超过 64 个 ASCII 可打印字符。 默认不传。用户明确指定时原样使用；用户明确要求重试时，同一逻辑请求的重试链必须复用同一 token。已有 token 时必须复用原值；此前请求未带 token 时，可从本次重试开始创建一次并持续复用，但该 token 不对此前请求提供追溯幂等。业务参数变化视为新请求，不得复用旧 token。不得为每次尝试生成不同值。调用端运行时不判断重试意图，也不自动生成 token。', 'type': 'string'})] = Field(None),
        media_output_destination: Annotated[str | None, WithJsonSchema({'description': '指定处理产物的目标存储位置；支持将处理产物存储至火山引擎视频点播（VOD）空间或对象存储（TOS）桶。存储至 VOD 时设为 `vod://<您的空间名>`，存储至 TOS 时设为 `tos://<您的桶名>`。设置后，任务结果中的 `url` 相关字段返回 `vod://` 或 `tos://` 格式的资源地址，不再返回临时下载地址。首次使用前需按需授权 AI MediaKit 将文件写入您的 VOD 空间或 TOS 桶。 仅在用户明确提供该值时传递；不得由 Agent 生成、推断或补写。', 'type': 'string'})] = Field(None),
        queue_id: Annotated[str | None, WithJsonSchema({'description': '任务提交的目标队列 ID；不传时默认使用系统自动创建的队列 ID。可将不同业务或优先级的任务提交到不同队列，以按队列对应的项目进行分账。队列可创建和管理，系统会自动分配队列 ID。 仅在用户明确提供该值时传递；不得由 Agent 生成、推断或补写。', 'type': 'string'})] = Field(None),
        transitions: Annotated[list[Any] | None, WithJsonSchema({'description': '图片间的转场效果 ID 列表；默认无转场（硬切）；如果列表长度小于所需转场数（图片数量 - 1），将循环使用列表中的效果。', 'items': {'description': '转场效果 ID\n分类：交替出场，ID：1182359\n分类：旋转放大，ID：1182360\n分类：泛开，ID：1182358\n分类：六角形，ID：1182365\n分类：故障转换，ID：1182367\n分类：飞眼，ID：1182368\n分类：梦幻放大，ID：1182369\n分类：开门展现，ID：1182370\n分类：立方转换，ID：1182373\n分类：透镜变换，ID：1182374\n分类：晚霞转场，ID：1182375\n分类：圆形交替，ID：1182378\n', 'enum': ['1182359', '1182360', '1182358', '1182365', '1182367', '1182368', '1182369', '1182370', '1182373', '1182374', '1182375', '1182378'], 'type': 'string'}, 'type': 'array'})] = Field(None),
    ) -> dict:
        try:
            result = get_client().call('image_to_video', **{
                key: item for key, item in {'images': images, 'callback_args': callback_args, 'callback_url': callback_url, 'client_token': client_token, 'media_output_destination': media_output_destination, 'queue_id': queue_id, 'transitions': transitions}.items()
                if item is not None
            })
            return async_task_response(result)
        except Exception as exc:
            return error_response(_structured_error(exc))

    @mcp.tool(name='mix_audio', description='将多个音频文件（如背景音乐、音效、人声）进行混音，生成一个新的音频文件。\n处理耗时：处理耗时与视频时长正相关。视频时长越长，处理耗时越长。平均 RTF（处理耗时/原片时长）为 1。\n输出音频的时长以最长的音频为准。\n输出视频格式：mp3')
    async def mix_audio(
        audio_urls: Annotated[list[Any], WithJsonSchema({'description': '待混合的音频列表，必须提供 1 到 100 个音频；单个输入文件大小建议不超过 10 GB；支持 mp3、wav、flac 等主流音频格式；支持公网 HTTP/HTTPS URL、火山引擎视频点播 vod:// 和火山引擎对象存储 tos:// 三种输入协议。', 'items': {'description': '待混合的输入音频。支持http://xxx或https://xxx格式 URL，支持 mp3、wav、flac 等格式', 'format': 'media-to-url', 'type': 'string'}, 'maxItems': 100, 'minItems': 1, 'type': 'array'})] = Field(...),
        callback_args: Annotated[str | None, WithJsonSchema({'description': '自定义回调参数；任务完成时会通过事件回调原样返回，用于关联业务；字段长度最大为 512 字节。 仅在用户明确提供该值时传递；不得由 Agent 生成、推断或补写。', 'type': 'string'})] = Field(None),
        callback_url: Annotated[str | None, WithJsonSchema({'description': '用于接收该任务结果回调的 URL 地址；提供后优先级高于全局回调地址；地址必须以 http:// 或 https:// 开头。 仅在用户明确提供该值时传递；不得由 Agent 生成、推断或补写。', 'type': 'string'})] = Field(None),
        client_token: Annotated[str | None, WithJsonSchema({'description': '用户请求凭证，用于幂等控制；大小写敏感，长度不超过 64 个 ASCII 可打印字符。 默认不传。用户明确指定时原样使用；用户明确要求重试时，同一逻辑请求的重试链必须复用同一 token。已有 token 时必须复用原值；此前请求未带 token 时，可从本次重试开始创建一次并持续复用，但该 token 不对此前请求提供追溯幂等。业务参数变化视为新请求，不得复用旧 token。不得为每次尝试生成不同值。调用端运行时不判断重试意图，也不自动生成 token。', 'type': 'string'})] = Field(None),
        format: Annotated[str | None, WithJsonSchema({'default': 'm4a', 'description': '输出音频格式，可选；支持 mp3、m4a、ogg、flac、wav，默认 m4a。', 'enum': ['mp3', 'm4a', 'ogg', 'flac', 'wav'], 'type': 'string'})] = Field(None, json_schema_extra={'default': 'm4a'}),
        media_output_destination: Annotated[str | None, WithJsonSchema({'description': '指定处理产物的目标存储位置；支持将处理产物存储至火山引擎视频点播（VOD）空间或对象存储（TOS）桶。存储至 VOD 时设为 `vod://<您的空间名>`，存储至 TOS 时设为 `tos://<您的桶名>`。设置后，任务结果中的 `url` 相关字段返回 `vod://` 或 `tos://` 格式的资源地址，不再返回临时下载地址。首次使用前需按需授权 AI MediaKit 将文件写入您的 VOD 空间或 TOS 桶。 仅在用户明确提供该值时传递；不得由 Agent 生成、推断或补写。', 'type': 'string'})] = Field(None),
        queue_id: Annotated[str | None, WithJsonSchema({'description': '任务提交的目标队列 ID；不传时默认使用系统自动创建的队列 ID。可将不同业务或优先级的任务提交到不同队列，以按队列对应的项目进行分账。队列可创建和管理，系统会自动分配队列 ID。 仅在用户明确提供该值时传递；不得由 Agent 生成、推断或补写。', 'type': 'string'})] = Field(None),
    ) -> dict:
        try:
            result = get_client().call('mix_audio', **{
                key: item for key, item in {'audio_urls': audio_urls, 'callback_args': callback_args, 'callback_url': callback_url, 'client_token': client_token, 'format': format, 'media_output_destination': media_output_destination, 'queue_id': queue_id}.items()
                if item is not None
            })
            return async_task_response(result)
        except Exception as exc:
            return error_response(_structured_error(exc))

    @mcp.tool(name='mux_audio_video', description='可将输入的音频流与视频流合并成一个新的视频文件，并可选择保留或替换视频的原有音轨；当音视频时长不一致时，可进行对齐处理。')
    async def mux_audio_video(
        audio_url: Annotated[str, WithJsonSchema({'description': '输入音频的 URL，支持公网 HTTP/HTTPS URL、vod:// 和 tos:// 三种输入协议；支持 mp3、m4a、wav 等主流音频格式；建议单个音频输入文件大小不超过 10 GB。', 'format': 'media-to-url', 'type': 'string'})] = Field(...),
        video_url: Annotated[str, WithJsonSchema({'description': '输入视频的 URL，支持公网 HTTP/HTTPS URL、vod:// 和 tos:// 三种输入协议；支持 mp4、flv、ts、avi、mov、wmv、mkv 等主流视频格式；最高支持 4K (3840×2160) 分辨率；建议单个视频输入文件大小不超过 10 GB。', 'format': 'media-to-url', 'type': 'string'})] = Field(...),
        callback_args: Annotated[str | None, WithJsonSchema({'description': '自定义回调参数；任务完成时会通过事件回调原样返回，用于关联业务；字段长度最大为 512 字节。 仅在用户明确提供该值时传递；不得由 Agent 生成、推断或补写。', 'type': 'string'})] = Field(None),
        callback_url: Annotated[str | None, WithJsonSchema({'description': '用于接收该任务结果回调的 URL 地址；提供后优先级高于全局回调地址；地址必须以 http:// 或 https:// 开头。 仅在用户明确提供该值时传递；不得由 Agent 生成、推断或补写。', 'type': 'string'})] = Field(None),
        client_token: Annotated[str | None, WithJsonSchema({'description': '用户请求凭证，用于幂等控制；大小写敏感，长度不超过 64 个 ASCII 可打印字符。 默认不传。用户明确指定时原样使用；用户明确要求重试时，同一逻辑请求的重试链必须复用同一 token。已有 token 时必须复用原值；此前请求未带 token 时，可从本次重试开始创建一次并持续复用，但该 token 不对此前请求提供追溯幂等。业务参数变化视为新请求，不得复用旧 token。不得为每次尝试生成不同值。调用端运行时不判断重试意图，也不自动生成 token。', 'type': 'string'})] = Field(None),
        is_audio_reserve: Annotated[bool | None, WithJsonSchema({'default': True, 'description': '可选，用于控制是否保留原视频中的原音轨；默认值为 true，即保留原音轨；为 true 时新音频将与原音频混音；为 false 时不保留原音轨，用新音频替换原有音频。', 'type': 'boolean'})] = Field(None, json_schema_extra={'default': True}),
        is_video_audio_sync: Annotated[bool | None, WithJsonSchema({'default': False, 'description': '可选，默认值为 false，即不对齐；为 false 时合成视频的时长以较长的媒体流为准；为 true 时根据 sync_mode 和 sync_method 的配置进行对齐处理。', 'type': 'boolean'})] = Field(None, json_schema_extra={'default': False}),
        media_output_destination: Annotated[str | None, WithJsonSchema({'description': '指定处理产物的目标存储位置；支持将处理产物存储至火山引擎视频点播（VOD）空间或对象存储（TOS）桶。存储至 VOD 时设为 `vod://<您的空间名>`，存储至 TOS 时设为 `tos://<您的桶名>`。设置后，任务结果中的 `url` 相关字段返回 `vod://` 或 `tos://` 格式的资源地址，不再返回临时下载地址。首次使用前需按需授权 AI MediaKit 将文件写入您的 VOD 空间或 TOS 桶。 仅在用户明确提供该值时传递；不得由 Agent 生成、推断或补写。', 'type': 'string'})] = Field(None),
        queue_id: Annotated[str | None, WithJsonSchema({'description': '任务提交的目标队列 ID；不传时默认使用系统自动创建的队列 ID。可将不同业务或优先级的任务提交到不同队列，以按队列对应的项目进行分账。队列可创建和管理，系统会自动分配队列 ID。 仅在用户明确提供该值时传递；不得由 Agent 生成、推断或补写。', 'type': 'string'})] = Field(None),
        sync_method: Annotated[str | None, WithJsonSchema({'default': 'trim', 'description': '可选，仅在 is_video_audio_sync 为 true 时生效，用于指定时长对齐方式；默认值为 trim（裁剪）；为 trim 时将较长的媒体流从末尾裁剪，使其与较短的对齐；为 speed 时通过加速或减速使两个媒体流时长一致。', 'type': 'string'})] = Field(None, json_schema_extra={'default': 'trim'}),
        sync_mode: Annotated[str | None, WithJsonSchema({'default': 'video', 'description': '可选，仅在 is_video_audio_sync 为 true 时生效，作为音视频时长对齐基准；默认值为 video，以视频时长为准；为 audio 时以音频时长为准，如视频更长则裁剪视频，如视频更短则根据 sync_method 处理；为 video 时，如音频更长则裁剪音频，如音频更短则根据 sync_method 处理。', 'type': 'string'})] = Field(None, json_schema_extra={'default': 'video'}),
    ) -> dict:
        try:
            result = get_client().call('mux_audio_video', **{
                key: item for key, item in {'audio_url': audio_url, 'video_url': video_url, 'callback_args': callback_args, 'callback_url': callback_url, 'client_token': client_token, 'is_audio_reserve': is_audio_reserve, 'is_video_audio_sync': is_video_audio_sync, 'media_output_destination': media_output_destination, 'queue_id': queue_id, 'sync_method': sync_method, 'sync_mode': sync_mode}.items()
                if item is not None
            })
            return async_task_response(result)
        except Exception as exc:
            return error_response(_structured_error(exc))

    @mcp.tool(name='rotate_video', description='用于视频画面旋转，对指定视频进行整体旋转。')
    async def rotate_video(
        rotate_direction: Annotated[str, WithJsonSchema({'description': '旋转方式，支持 rotate_left_90、rotate_right_90、rotate_180：rotate_left_90 表示向左旋转 90 度，rotate_right_90 表示向右旋转 90 度，rotate_180 表示旋转 180 度。', 'enum': ['rotate_left_90', 'rotate_right_90', 'rotate_180'], 'type': 'string'})] = Field(...),
        video_url: Annotated[str, WithJsonSchema({'description': '待旋转的视频 URL，支持公网 HTTP/HTTPS URL、火山引擎视频点播 vod:// 和火山引擎对象存储 tos:// 三种输入协议；支持 mp4、flv、ts、avi、mov、wmv、mkv 等主流视频格式；最高支持 4K (3840×2160) 分辨率；建议输入文件大小不超过 10 GB。', 'format': 'media-to-vid', 'type': 'string'})] = Field(...),
        callback_args: Annotated[str | None, WithJsonSchema({'description': '自定义回调参数；任务完成时会通过事件回调原样返回，用于关联业务；字段长度最大为 512 字节。 仅在用户明确提供该值时传递；不得由 Agent 生成、推断或补写。', 'type': 'string'})] = Field(None),
        callback_url: Annotated[str | None, WithJsonSchema({'description': '用于接收该任务结果回调的 URL 地址；提供后优先级高于全局回调地址；地址必须以 http:// 或 https:// 开头。 仅在用户明确提供该值时传递；不得由 Agent 生成、推断或补写。', 'type': 'string'})] = Field(None),
        client_token: Annotated[str | None, WithJsonSchema({'description': '用户请求凭证，用于幂等控制；大小写敏感，长度不超过 64 个 ASCII 可打印字符。 默认不传。用户明确指定时原样使用；用户明确要求重试时，同一逻辑请求的重试链必须复用同一 token。已有 token 时必须复用原值；此前请求未带 token 时，可从本次重试开始创建一次并持续复用，但该 token 不对此前请求提供追溯幂等。业务参数变化视为新请求，不得复用旧 token。不得为每次尝试生成不同值。调用端运行时不判断重试意图，也不自动生成 token。', 'type': 'string'})] = Field(None),
        media_output_destination: Annotated[str | None, WithJsonSchema({'description': '指定处理产物的目标存储位置；支持将处理产物存储至火山引擎视频点播（VOD）空间或对象存储（TOS）桶。存储至 VOD 时设为 `vod://<您的空间名>`，存储至 TOS 时设为 `tos://<您的桶名>`。设置后，任务结果中的 `url` 相关字段返回 `vod://` 或 `tos://` 格式的资源地址，不再返回临时下载地址。首次使用前需按需授权 AI MediaKit 将文件写入您的 VOD 空间或 TOS 桶。 仅在用户明确提供该值时传递；不得由 Agent 生成、推断或补写。', 'type': 'string'})] = Field(None),
        queue_id: Annotated[str | None, WithJsonSchema({'description': '任务提交的目标队列 ID；不传时默认使用系统自动创建的队列 ID。可将不同业务或优先级的任务提交到不同队列，以按队列对应的项目进行分账。队列可创建和管理，系统会自动分配队列 ID。 仅在用户明确提供该值时传递；不得由 Agent 生成、推断或补写。', 'type': 'string'})] = Field(None),
    ) -> dict:
        try:
            result = get_client().call('rotate_video', **{
                key: item for key, item in {'rotate_direction': rotate_direction, 'video_url': video_url, 'callback_args': callback_args, 'callback_url': callback_url, 'client_token': client_token, 'media_output_destination': media_output_destination, 'queue_id': queue_id}.items()
                if item is not None
            })
            return async_task_response(result)
        except Exception as exc:
            return error_response(_structured_error(exc))

    @mcp.tool(name='stitch_video', description='将多个视频在空间上按水平或垂直方向拼接成一个完整画面，适用于多视角对比、画面组合等场景。')
    async def stitch_video(
        stitch_direction: Annotated[str, WithJsonSchema({'description': '拼接方式：horizontal 表示左右拼接，vertical 表示上下拼接。', 'enum': ['horizontal', 'vertical'], 'type': 'string'})] = Field(...),
        videos: Annotated[list[Any], WithJsonSchema({'description': '待拼接的视频对象列表，最少传入 2 个，最多传入 3 个；拼接画面的顺序与列表顺序一致。', 'items': {'properties': {'keep_audio': {'default': True, 'description': '是否保留该视频的音频。默认值 true；为 false 时，该视频的音轨不会被合入最终产物。', 'type': 'boolean'}, 'video_url': {'description': '待拼接的输入视频地址。支持公网 HTTP/HTTPS、视频点播 vod://、对象存储 tos:// 三种输入协议；支持 mp4、flv、ts、avi、mov、wmv、mkv 等主流视频格式。输入视频最高支持 4K (3840×2160) 分辨率。建议输入文件大小不超过 10 GB。建议输入视频的宽高比为 16:9、9:16、1:1、4:3、3:4 等常见规格，以获得更好的拼接效果。', 'format': 'media-to-vid', 'type': 'string'}}, 'required': ['video_url'], 'type': 'object'}, 'maxItems': 3, 'minItems': 2, 'type': 'array'})] = Field(...),
        callback_args: Annotated[str | None, WithJsonSchema({'description': '自定义回调参数；任务完成时会通过事件回调原样返回，用于关联业务；字段长度最大为 512 字节。 仅在用户明确提供该值时传递；不得由 Agent 生成、推断或补写。', 'type': 'string'})] = Field(None),
        callback_url: Annotated[str | None, WithJsonSchema({'description': '用于接收该任务结果回调的 URL 地址；提供后优先级高于全局回调地址；地址必须以 http:// 或 https:// 开头。 仅在用户明确提供该值时传递；不得由 Agent 生成、推断或补写。', 'type': 'string'})] = Field(None),
        client_token: Annotated[str | None, WithJsonSchema({'description': '用户请求凭证，用于幂等控制；大小写敏感，长度不超过 64 个 ASCII 可打印字符。 默认不传。用户明确指定时原样使用；用户明确要求重试时，同一逻辑请求的重试链必须复用同一 token。已有 token 时必须复用原值；此前请求未带 token 时，可从本次重试开始创建一次并持续复用，但该 token 不对此前请求提供追溯幂等。业务参数变化视为新请求，不得复用旧 token。不得为每次尝试生成不同值。调用端运行时不判断重试意图，也不自动生成 token。', 'type': 'string'})] = Field(None),
        media_output_destination: Annotated[str | None, WithJsonSchema({'description': '指定处理产物的目标存储位置；支持将处理产物存储至火山引擎视频点播（VOD）空间或对象存储（TOS）桶。存储至 VOD 时设为 `vod://<您的空间名>`，存储至 TOS 时设为 `tos://<您的桶名>`。设置后，任务结果中的 `url` 相关字段返回 `vod://` 或 `tos://` 格式的资源地址，不再返回临时下载地址。首次使用前需按需授权 AI MediaKit 将文件写入您的 VOD 空间或 TOS 桶。 仅在用户明确提供该值时传递；不得由 Agent 生成、推断或补写。', 'type': 'string'})] = Field(None),
        queue_id: Annotated[str | None, WithJsonSchema({'description': '任务提交的目标队列 ID；不传时默认使用系统自动创建的队列 ID。可将不同业务或优先级的任务提交到不同队列，以按队列对应的项目进行分账。队列可创建和管理，系统会自动分配队列 ID。 仅在用户明确提供该值时传递；不得由 Agent 生成、推断或补写。', 'type': 'string'})] = Field(None),
    ) -> dict:
        try:
            result = get_client().call('stitch_video', **{
                key: item for key, item in {'stitch_direction': stitch_direction, 'videos': videos, 'callback_args': callback_args, 'callback_url': callback_url, 'client_token': client_token, 'media_output_destination': media_output_destination, 'queue_id': queue_id}.items()
                if item is not None
            })
            return async_task_response(result)
        except Exception as exc:
            return error_response(_structured_error(exc))

    @mcp.tool(name='text_to_scrolling_video', description='将指定文本内容转换为文字滚屏视频，输出视频为固定 9:16 竖版，常用于小说推文、内容讲解和歌词视频等场景。')
    async def text_to_scrolling_video(
        image_url: Annotated[str, WithJsonSchema({'description': '背景图片 URL。支持公网 HTTP/HTTPS URL和 tos:// 火山引擎对象存储两种输入协议，支持 jpg、png 等主流静态图片格式。建议背景图片宽高比为 9:16，与输出视频一致；建议背景图片分辨率尽量与 resolution 选择的输出视频分辨率一致；建议背景图片整体基调与 font_color 形成足够对比度。系统自动裁切背景图片顶部 10% 和底部 10% 区域，裁切区域作为半透明遮罩叠加在视频顶部和底部，增强滚屏文字可读性；建议背景图片顶部和底部各 10% 区域不包含关键信息。', 'format': 'media-to-url', 'type': 'string'})] = Field(...),
        text: Annotated[str, WithJsonSchema({'description': '滚屏文本内容，支持使用 \\n 强制换行；未包含 \\n 时，文本会按画布宽度自动换行。文本横排、左对齐显示。若要显示单个斜杠 /，传入 text 时需输入两个斜杠 //。', 'minLength': 1, 'type': 'string'})] = Field(...),
        audio_url: Annotated[str | None, WithJsonSchema({'description': '背景音乐 URL。支持公网 HTTP/HTTPS URL、vod:// 火山引擎视频点播和 tos:// 火山引擎对象存储三种输入协议，支持 mp3、m4a、wav 等主流音频格式。建议单个输入音频文件不超过 10 GB。提供背景音乐后，会无缝循环播放并覆盖整个视频时长，直到视频结束；若背景音乐时长超过视频时长，超出部分会自动截断。', 'format': 'media-to-url', 'type': 'string'})] = Field(None),
        callback_args: Annotated[str | None, WithJsonSchema({'description': '自定义回调参数；任务完成时会通过事件回调原样返回，用于关联业务；字段长度最大为 512 字节。 仅在用户明确提供该值时传递；不得由 Agent 生成、推断或补写。', 'type': 'string'})] = Field(None),
        callback_url: Annotated[str | None, WithJsonSchema({'description': '用于接收该任务结果回调的 URL 地址；提供后优先级高于全局回调地址；地址必须以 http:// 或 https:// 开头。 仅在用户明确提供该值时传递；不得由 Agent 生成、推断或补写。', 'type': 'string'})] = Field(None),
        client_token: Annotated[str | None, WithJsonSchema({'description': '用户请求凭证，用于幂等控制；大小写敏感，长度不超过 64 个 ASCII 可打印字符。 默认不传。用户明确指定时原样使用；用户明确要求重试时，同一逻辑请求的重试链必须复用同一 token。已有 token 时必须复用原值；此前请求未带 token 时，可从本次重试开始创建一次并持续复用，但该 token 不对此前请求提供追溯幂等。业务参数变化视为新请求，不得复用旧 token。不得为每次尝试生成不同值。调用端运行时不判断重试意图，也不自动生成 token。', 'type': 'string'})] = Field(None),
        end_hold_duration: Annotated[float | None, WithJsonSchema({'default': 2, 'description': '视频结束时，文字在结束位置静止停留的时长，单位为秒，范围 0 到 60，默认 2。', 'maximum': 60, 'minimum': 0, 'type': 'number'})] = Field(None, json_schema_extra={'default': 2}),
        font_color: Annotated[str | None, WithJsonSchema({'default': '#1F1F1FFF', 'description': '字体颜色必须采用 8 位 RGBA 十六进制 RRGGBBAA 格式，默认 #1F1F1FFF，表示不透明深灰色。使用深色背景图时，建议传入浅色字体（如 #FFFFFFFF）以保证可读性。', 'pattern': '^#[0-9A-Fa-f]{8}$', 'type': 'string'})] = Field(None, json_schema_extra={'default': '#1F1F1FFF'}),
        font_type: Annotated[str | None, WithJsonSchema({'default': 'sy_black', 'description': '滚屏文本字体支持 sy_black、pm_zhengdao、ali_puhui、zhanku_kuaile，默认 sy_black。sy_black 表示思源黑体，风格经典、端正、百搭；pm_zhengdao 表示庞门正道标题体，风格粗壮、有力；ali_puhui 表示阿里巴巴普惠体，风格现代、饱满；zhanku_kuaile 表示站酷快乐体，风格圆润、活泼。', 'enum': ['sy_black', 'pm_zhengdao', 'ali_puhui', 'zhanku_kuaile'], 'type': 'string'})] = Field(None, json_schema_extra={'default': 'sy_black'}),
        media_output_destination: Annotated[str | None, WithJsonSchema({'description': '指定处理产物的目标存储位置；支持将处理产物存储至火山引擎视频点播（VOD）空间或对象存储（TOS）桶。存储至 VOD 时设为 `vod://<您的空间名>`，存储至 TOS 时设为 `tos://<您的桶名>`。设置后，任务结果中的 `url` 相关字段返回 `vod://` 或 `tos://` 格式的资源地址，不再返回临时下载地址。首次使用前需按需授权 AI MediaKit 将文件写入您的 VOD 空间或 TOS 桶。 仅在用户明确提供该值时传递；不得由 Agent 生成、推断或补写。', 'type': 'string'})] = Field(None),
        queue_id: Annotated[str | None, WithJsonSchema({'description': '任务提交的目标队列 ID；不传时默认使用系统自动创建的队列 ID。可将不同业务或优先级的任务提交到不同队列，以按队列对应的项目进行分账。队列可创建和管理，系统会自动分配队列 ID。 仅在用户明确提供该值时传递；不得由 Agent 生成、推断或补写。', 'type': 'string'})] = Field(None),
        resolution: Annotated[str | None, WithJsonSchema({'default': '720p', 'description': '输出分辨率选择固定 9:16 的竖版规格，支持 360p、480p、720p、1080p，默认 720p。360p 对应 360 × 640 像素输出尺寸，480p 对应 480 × 854 像素输出尺寸，720p 对应 720 × 1280 像素输出尺寸且为默认档位，1080p 对应 1080 × 1920 像素输出尺寸。字体大小随 resolution 档位线性缩放，以保持视觉效果一致；在 720p 分辨率下，字号约为 36px。', 'enum': ['360p', '480p', '720p', '1080p'], 'type': 'string'})] = Field(None, json_schema_extra={'default': '720p'}),
        single_roll_duration: Annotated[float | None, WithJsonSchema({'default': 3, 'description': '单页文字从进入画面到完全滚出画面所需时间，也表示单页文字完全滚过屏幕的时长，单位为秒，范围 0.5 到 60，默认 3。single_roll_duration 越小，滚动速度越快。', 'maximum': 60, 'minimum': 0.5, 'type': 'number'})] = Field(None, json_schema_extra={'default': 3}),
        start_hold_duration: Annotated[float | None, WithJsonSchema({'default': 2, 'description': '视频开始时，文字在起始位置静止停留的时长，单位为秒，范围 0 到 60，默认 2。', 'maximum': 60, 'minimum': 0, 'type': 'number'})] = Field(None, json_schema_extra={'default': 2}),
    ) -> dict:
        try:
            result = get_client().call('text_to_scrolling_video', **{
                key: item for key, item in {'image_url': image_url, 'text': text, 'audio_url': audio_url, 'callback_args': callback_args, 'callback_url': callback_url, 'client_token': client_token, 'end_hold_duration': end_hold_duration, 'font_color': font_color, 'font_type': font_type, 'media_output_destination': media_output_destination, 'queue_id': queue_id, 'resolution': resolution, 'single_roll_duration': single_roll_duration, 'start_hold_duration': start_hold_duration}.items()
                if item is not None
            })
            return async_task_response(result)
        except Exception as exc:
            return error_response(_structured_error(exc))

    @mcp.tool(name='trim_audio', description='用于音频裁剪，按指定的开始时间和结束时间从输入音频中截取片段。')
    async def trim_audio(
        audio_url: Annotated[str, WithJsonSchema({'description': '待裁剪音频的 URL，支持 mp3、m4a、wav 等主流音频格式，支持公网 HTTP/HTTPS URL、火山引擎视频点播 vod:// 和火山引擎对象存储 tos:// 三种输入协议；建议单个输入文件大小不超过 10 GB。', 'format': 'media-to-url', 'type': 'string'})] = Field(...),
        callback_args: Annotated[str | None, WithJsonSchema({'description': '自定义回调参数；任务完成时会通过事件回调原样返回，用于关联业务；字段长度最大为 512 字节。 仅在用户明确提供该值时传递；不得由 Agent 生成、推断或补写。', 'type': 'string'})] = Field(None),
        callback_url: Annotated[str | None, WithJsonSchema({'description': '用于接收该任务结果回调的 URL 地址；提供后优先级高于全局回调地址；地址必须以 http:// 或 https:// 开头。 仅在用户明确提供该值时传递；不得由 Agent 生成、推断或补写。', 'type': 'string'})] = Field(None),
        client_token: Annotated[str | None, WithJsonSchema({'description': '用户请求凭证，用于幂等控制；大小写敏感，长度不超过 64 个 ASCII 可打印字符。 默认不传。用户明确指定时原样使用；用户明确要求重试时，同一逻辑请求的重试链必须复用同一 token。已有 token 时必须复用原值；此前请求未带 token 时，可从本次重试开始创建一次并持续复用，但该 token 不对此前请求提供追溯幂等。业务参数变化视为新请求，不得复用旧 token。不得为每次尝试生成不同值。调用端运行时不判断重试意图，也不自动生成 token。', 'type': 'string'})] = Field(None),
        end_time: Annotated[float | None, WithJsonSchema({'description': '裁剪结束时间，单位为秒，支持最多两位小数；必须大于 start_time；end_time 可省略，不传时默认裁剪到输入音频末尾。', 'minimum': 0, 'type': 'number'})] = Field(None),
        format: Annotated[str | None, WithJsonSchema({'default': 'm4a', 'description': '输出音频格式支持 mp3、m4a、ogg、flac、wav，默认值为 m4a。', 'enum': ['mp3', 'm4a', 'ogg', 'flac', 'wav'], 'type': 'string'})] = Field(None, json_schema_extra={'default': 'm4a'}),
        media_output_destination: Annotated[str | None, WithJsonSchema({'description': '指定处理产物的目标存储位置；支持将处理产物存储至火山引擎视频点播（VOD）空间或对象存储（TOS）桶。存储至 VOD 时设为 `vod://<您的空间名>`，存储至 TOS 时设为 `tos://<您的桶名>`。设置后，任务结果中的 `url` 相关字段返回 `vod://` 或 `tos://` 格式的资源地址，不再返回临时下载地址。首次使用前需按需授权 AI MediaKit 将文件写入您的 VOD 空间或 TOS 桶。 仅在用户明确提供该值时传递；不得由 Agent 生成、推断或补写。', 'type': 'string'})] = Field(None),
        queue_id: Annotated[str | None, WithJsonSchema({'description': '任务提交的目标队列 ID；不传时默认使用系统自动创建的队列 ID。可将不同业务或优先级的任务提交到不同队列，以按队列对应的项目进行分账。队列可创建和管理，系统会自动分配队列 ID。 仅在用户明确提供该值时传递；不得由 Agent 生成、推断或补写。', 'type': 'string'})] = Field(None),
        start_time: Annotated[float | None, WithJsonSchema({'default': 0, 'description': '裁剪开始时间，单位为秒，默认值为 0，0 表示从音频开头开始；支持最多两位小数；必须小于 end_time。', 'minimum': 0, 'type': 'number'})] = Field(None, json_schema_extra={'default': 0}),
    ) -> dict:
        try:
            result = get_client().call('trim_audio', **{
                key: item for key, item in {'audio_url': audio_url, 'callback_args': callback_args, 'callback_url': callback_url, 'client_token': client_token, 'end_time': end_time, 'format': format, 'media_output_destination': media_output_destination, 'queue_id': queue_id, 'start_time': start_time}.items()
                if item is not None
            })
            return async_task_response(result)
        except Exception as exc:
            return error_response(_structured_error(exc))

    @mcp.tool(name='trim_video', description='用于视频裁剪，可按指定的开始和结束时间从输入视频截取片段。')
    async def trim_video(
        video_url: Annotated[str, WithJsonSchema({'description': '待裁剪视频的 URL；支持公网 HTTP/HTTPS、火山引擎视频点播 vod:// 和火山引擎对象存储 tos:// 三种来源协议；支持 mp4、flv、ts、avi、mov、wmv、mkv 等主流视频格式；最高支持 4K（3840×2160）分辨率；建议单个输入文件不超过 10 GB。', 'format': 'media-to-url', 'type': 'string'})] = Field(...),
        callback_args: Annotated[str | None, WithJsonSchema({'description': '自定义回调参数；任务完成时会通过事件回调原样返回，用于关联业务；字段长度最大为 512 字节。 仅在用户明确提供该值时传递；不得由 Agent 生成、推断或补写。', 'type': 'string'})] = Field(None),
        callback_url: Annotated[str | None, WithJsonSchema({'description': '用于接收该任务结果回调的 URL 地址；提供后优先级高于全局回调地址；地址必须以 http:// 或 https:// 开头。 仅在用户明确提供该值时传递；不得由 Agent 生成、推断或补写。', 'type': 'string'})] = Field(None),
        client_token: Annotated[str | None, WithJsonSchema({'description': '用户请求凭证，用于幂等控制；大小写敏感，长度不超过 64 个 ASCII 可打印字符。 默认不传。用户明确指定时原样使用；用户明确要求重试时，同一逻辑请求的重试链必须复用同一 token。已有 token 时必须复用原值；此前请求未带 token 时，可从本次重试开始创建一次并持续复用，但该 token 不对此前请求提供追溯幂等。业务参数变化视为新请求，不得复用旧 token。不得为每次尝试生成不同值。调用端运行时不判断重试意图，也不自动生成 token。', 'type': 'string'})] = Field(None),
        end_time: Annotated[float | None, WithJsonSchema({'description': '裁剪结束时间，单位为秒；支持最多两位小数；必须大于 start_time。未传时默认裁剪到输入视频末尾。', 'minimum': 0, 'type': 'number'})] = Field(None),
        media_output_destination: Annotated[str | None, WithJsonSchema({'description': '指定处理产物的目标存储位置；支持将处理产物存储至火山引擎视频点播（VOD）空间或对象存储（TOS）桶。存储至 VOD 时设为 `vod://<您的空间名>`，存储至 TOS 时设为 `tos://<您的桶名>`。设置后，任务结果中的 `url` 相关字段返回 `vod://` 或 `tos://` 格式的资源地址，不再返回临时下载地址。首次使用前需按需授权 AI MediaKit 将文件写入您的 VOD 空间或 TOS 桶。 仅在用户明确提供该值时传递；不得由 Agent 生成、推断或补写。', 'type': 'string'})] = Field(None),
        queue_id: Annotated[str | None, WithJsonSchema({'description': '任务提交的目标队列 ID；不传时默认使用系统自动创建的队列 ID。可将不同业务或优先级的任务提交到不同队列，以按队列对应的项目进行分账。队列可创建和管理，系统会自动分配队列 ID。 仅在用户明确提供该值时传递；不得由 Agent 生成、推断或补写。', 'type': 'string'})] = Field(None),
        start_time: Annotated[float | None, WithJsonSchema({'default': 0, 'description': '裁剪开始时间，单位为秒；支持最多两位小数；必须小于 end_time。默认为 0，表示从视频开头开始。', 'minimum': 0, 'type': 'number'})] = Field(None, json_schema_extra={'default': 0}),
    ) -> dict:
        try:
            result = get_client().call('trim_video', **{
                key: item for key, item in {'video_url': video_url, 'callback_args': callback_args, 'callback_url': callback_url, 'client_token': client_token, 'end_time': end_time, 'media_output_destination': media_output_destination, 'queue_id': queue_id, 'start_time': start_time}.items()
                if item is not None
            })
            return async_task_response(result)
        except Exception as exc:
            return error_response(_structured_error(exc))

