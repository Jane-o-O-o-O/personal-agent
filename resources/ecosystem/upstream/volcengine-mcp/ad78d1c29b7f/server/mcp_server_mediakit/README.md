# MediaKit MCP Server

MediaKit MCP Server is a standard AI capability plugin for Volcano Engine AI MediaKit. It is built on [FastMCP](https://gofastmcp.com/servers/server) and the MCP (Model Context Protocol), exposing cloud media capabilities such as video editing, audio processing, subtitle processing, and video enhancement as tools that can be called by AI agents. With MediaKit MCP, developers can use natural language to drive intelligent media production workflows.

| Field       | Value                                                             |
| ----------- | ----------------------------------------------------------------- |
| Version     | v1.0.0                                                            |
| Description | MediaKit MCP intelligent media assistant                          |
| Categories  | Media cloud, audio/video editing, video enhancement               |
| Tags        | MCP, MediaKit, video editing, audio processing, video enhancement |

## Tool Overview

MediaKit MCP provides tools that cover the full workflow from asynchronous task query to deep media editing and video enhancement. All tools support dynamic loading by group or by tool name to optimize agent reasoning efficiency. Tool filtering applies to both `tools/list` and `tools/call`; tools in the `shared` group (such as `query_task`) are always available.

## Architecture

MediaKit MCP Server is implemented with standalone **FastMCP** and two middleware layers:

| Component | Responsibility |
| --- | --- |
| `ToolFilterMiddleware` | Filter visible and callable tools by `x-mcp-domains` / `x-mcp-tools` (HTTP) or `MCP_DOMAINS` / `MCP_TOOLS` (stdio) |
| `ClientBindMiddleware` | Bind a `MediakitClient` to the current request context before each tool call |
| `get_client()` | Tool handlers obtain the bound client through request-scoped context |

Local stdio mode passes the API key through the `MEDIAKIT_API_KEY` environment variable. Cloud HTTP mode expects each client request to carry `x-amk-api-key`. They refer to the same MediaKit credential with different transports. Do not set a shared `MEDIAKIT_API_KEY` on the server for multi-tenant deployments.

<table>
  <thead>
    <tr>
      <th>Category</th>
      <th>Group</th>
      <th>Tool</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td rowspan="1"><b>Shared</b></td>
      <td rowspan="1">shared</td>
      <td>query_task</td>
      <td><b>Task query</b>: Query asynchronous task status. After submitting an asynchronous task, use this tool to fetch its progress and result. Supports polling via poll_interval_seconds + max_poll_attempts. For detailed input and output parameters, see
        <a href="https://github.com/volcengine/mcp-server/blob/main/server/mcp_server_mediakit/src/mediakit/mcp_tools/shared.py#L36">query_task</a>.
      </td>
    </tr>
    <tr>
      <td rowspan="23"><b>Video editing</b></td>
      <td rowspan="23">editing</td>
      <td>add_image_to_video</td>
      <td><b>Add Image To Video</b>: Overlay an image on a video, commonly used for image watermarks. Supports configuring image size, position, start_time and end_time. For detailed input and output parameters, see
        <a href="https://github.com/volcengine/mcp-server/blob/main/server/mcp_server_mediakit/src/mediakit/mcp_tools/editing.py#L26">add_image_to_video</a>.
      </td>
    </tr>
    <tr>
      <td>add_subtitle_to_video</td>
      <td><b>Add Subtitle To Video</b>: Burn a subtitle file or subtitle text list into a video with configurable font, color, size and position presets. For detailed input and output parameters, see
        <a href="https://github.com/volcengine/mcp-server/blob/main/server/mcp_server_mediakit/src/mediakit/mcp_tools/editing.py#L51">add_subtitle_to_video</a>.
      </td>
    </tr>
    <tr>
      <td>adjust_audio_speed</td>
      <td><b>Adjust Audio Speed</b>: 用于音频调速，可调整音频播放倍速，实现快放或慢放效果. For detailed input and output parameters, see
        <a href="https://github.com/volcengine/mcp-server/blob/main/server/mcp_server_mediakit/src/mediakit/mcp_tools/editing.py#L75">adjust_audio_speed</a>.
      </td>
    </tr>
    <tr>
      <td>adjust_video_speed</td>
      <td><b>Adjust Video Speed</b>: Adjust the playback speed of a video for fast/slow motion effects. Supports speed range 0.1~4. For detailed input and output parameters, see
        <a href="https://github.com/volcengine/mcp-server/blob/main/server/mcp_server_mediakit/src/mediakit/mcp_tools/editing.py#L95">adjust_video_speed</a>.
      </td>
    </tr>
    <tr>
      <td>adjust_video_volume</td>
      <td><b>Adjust Video Volume</b>: 用于调整输入视频的音量大小，也可实现静音. For detailed input and output parameters, see
        <a href="https://github.com/volcengine/mcp-server/blob/main/server/mcp_server_mediakit/src/mediakit/mcp_tools/editing.py#L114">adjust_video_volume</a>.
      </td>
    </tr>
    <tr>
      <td>apply_camera_motion</td>
      <td><b>Apply Camera Motion</b>: 对输入视频在指定时间段内添加一种运镜特效，常用于素材二次创作、营销片头、短剧动效等场景. For detailed input and output parameters, see
        <a href="https://github.com/volcengine/mcp-server/blob/main/server/mcp_server_mediakit/src/mediakit/mcp_tools/editing.py#L133">apply_camera_motion</a>.
      </td>
    </tr>
    <tr>
      <td>apply_video_filter</td>
      <td><b>Apply Video Filter</b>: 为指定视频添加滤镜效果. For detailed input and output parameters, see
        <a href="https://github.com/volcengine/mcp-server/blob/main/server/mcp_server_mediakit/src/mediakit/mcp_tools/editing.py#L153">apply_video_filter</a>.
      </td>
    </tr>
    <tr>
      <td>concat_audio</td>
      <td><b>Concat Audio</b>: Concatenate multiple audio clips into a single audio file. For detailed input and output parameters, see
        <a href="https://github.com/volcengine/mcp-server/blob/main/server/mcp_server_mediakit/src/mediakit/mcp_tools/editing.py#L172">concat_audio</a>.
      </td>
    </tr>
    <tr>
      <td>concat_video</td>
      <td><b>Concat Video</b>: Concatenate multiple video clips into a new video, with optional transition effects. For detailed input and output parameters, see
        <a href="https://github.com/volcengine/mcp-server/blob/main/server/mcp_server_mediakit/src/mediakit/mcp_tools/editing.py#L191">concat_video</a>.
      </td>
    </tr>
    <tr>
      <td>crop_video</td>
      <td><b>Crop Video</b>: 按指定的矩形区域裁剪视频画面，裁剪结果仅保留指定的需要区域. For detailed input and output parameters, see
        <a href="https://github.com/volcengine/mcp-server/blob/main/server/mcp_server_mediakit/src/mediakit/mcp_tools/editing.py#L210">crop_video</a>.
      </td>
    </tr>
    <tr>
      <td>extract_animated_image</td>
      <td><b>Extract Animated Image</b>: 从视频中按指定开始时间和结束时间截取一段画面，生成 GIF 或 WebP 动图，常用于制作封面动图、营销素材和短预览. For detailed input and output parameters, see
        <a href="https://github.com/volcengine/mcp-server/blob/main/server/mcp_server_mediakit/src/mediakit/mcp_tools/editing.py#L232">extract_animated_image</a>.
      </td>
    </tr>
    <tr>
      <td>extract_audio</td>
      <td><b>Extract Audio</b>: Separate the audio stream from a video and save it as an independent audio file. Supports mp3 / m4a output. For detailed input and output parameters, see
        <a href="https://github.com/volcengine/mcp-server/blob/main/server/mcp_server_mediakit/src/mediakit/mcp_tools/editing.py#L253">extract_audio</a>.
      </td>
    </tr>
    <tr>
      <td>fade_audio</td>
      <td><b>Fade Audio</b>: 对输入音频的起止位置实现淡入或淡出效果，输出处理后的音频文件. For detailed input and output parameters, see
        <a href="https://github.com/volcengine/mcp-server/blob/main/server/mcp_server_mediakit/src/mediakit/mcp_tools/editing.py#L272">fade_audio</a>.
      </td>
    </tr>
    <tr>
      <td>fade_video_audio</td>
      <td><b>Fade Video Audio</b>: 在片头或片尾对输入视频音轨执行淡入或淡出处理，用于弱化音轨突兀的起止，提升成片听感。输出处理后的视频文件. For detailed input and output parameters, see
        <a href="https://github.com/volcengine/mcp-server/blob/main/server/mcp_server_mediakit/src/mediakit/mcp_tools/editing.py#L293">fade_video_audio</a>.
      </td>
    </tr>
    <tr>
      <td>flip_video</td>
      <td><b>Flip Video</b>: Flip a video vertically and/or horizontally. For detailed input and output parameters, see
        <a href="https://github.com/volcengine/mcp-server/blob/main/server/mcp_server_mediakit/src/mediakit/mcp_tools/editing.py#L313">flip_video</a>.
      </td>
    </tr>
    <tr>
      <td>image_to_video</td>
      <td><b>Image To Video</b>: Compose multiple images into an animated video, with configurable per-image duration, animation and optional transitions. For detailed input and output parameters, see
        <a href="https://github.com/volcengine/mcp-server/blob/main/server/mcp_server_mediakit/src/mediakit/mcp_tools/editing.py#L333">image_to_video</a>.
      </td>
    </tr>
    <tr>
      <td>mix_audio</td>
      <td><b>Mix Audio</b>: 将多个音频文件（如背景音乐、音效、人声）进行混音，生成一个新的音频文件。
处理耗时：处理耗时与视频时长正相关。视频时长越长，处理耗时越长。平均 RTF（处理耗时/原片时长）为 1。
输出音频的时长以最长的音频为准。
输出视频格式：mp3. For detailed input and output parameters, see
        <a href="https://github.com/volcengine/mcp-server/blob/main/server/mcp_server_mediakit/src/mediakit/mcp_tools/editing.py#L352">mix_audio</a>.
      </td>
    </tr>
    <tr>
      <td>mux_audio_video</td>
      <td><b>Mux Audio Video</b>: Mux audio and video into a single output, with optional duration alignment by trim or speed adjustment. For detailed input and output parameters, see
        <a href="https://github.com/volcengine/mcp-server/blob/main/server/mcp_server_mediakit/src/mediakit/mcp_tools/editing.py#L371">mux_audio_video</a>.
      </td>
    </tr>
    <tr>
      <td>rotate_video</td>
      <td><b>Rotate Video</b>: 用于视频画面旋转，对指定视频进行整体旋转. For detailed input and output parameters, see
        <a href="https://github.com/volcengine/mcp-server/blob/main/server/mcp_server_mediakit/src/mediakit/mcp_tools/editing.py#L394">rotate_video</a>.
      </td>
    </tr>
    <tr>
      <td>stitch_video</td>
      <td><b>Stitch Video</b>: 将多个视频在空间上按水平或垂直方向拼接成一个完整画面，适用于多视角对比、画面组合等场景. For detailed input and output parameters, see
        <a href="https://github.com/volcengine/mcp-server/blob/main/server/mcp_server_mediakit/src/mediakit/mcp_tools/editing.py#L413">stitch_video</a>.
      </td>
    </tr>
    <tr>
      <td>text_to_scrolling_video</td>
      <td><b>Text To Scrolling Video</b>: 将指定文本内容转换为文字滚屏视频，输出视频为固定 9:16 竖版，常用于小说推文、内容讲解和歌词视频等场景. For detailed input and output parameters, see
        <a href="https://github.com/volcengine/mcp-server/blob/main/server/mcp_server_mediakit/src/mediakit/mcp_tools/editing.py#L432">text_to_scrolling_video</a>.
      </td>
    </tr>
    <tr>
      <td>trim_audio</td>
      <td><b>Trim Audio</b>: Trim an audio clip by specifying start_time and end_time in seconds. For detailed input and output parameters, see
        <a href="https://github.com/volcengine/mcp-server/blob/main/server/mcp_server_mediakit/src/mediakit/mcp_tools/editing.py#L458">trim_audio</a>.
      </td>
    </tr>
    <tr>
      <td>trim_video</td>
      <td><b>Trim Video</b>: Trim a video clip by specifying start_time and end_time in seconds. For detailed input and output parameters, see
        <a href="https://github.com/volcengine/mcp-server/blob/main/server/mcp_server_mediakit/src/mediakit/mcp_tools/editing.py#L479">trim_video</a>.
      </td>
    </tr>
    <tr>
      <td rowspan="4"><b>Audio processing</b></td>
      <td rowspan="4">audio</td>
      <td>detect_voice_activity</td>
      <td><b>Detect Voice Activity</b>: 用于语音端点识别。自动定位音频或视频文件中有效语音的起止时间。将人声和静音、背景噪声等无效片段区分开来。返回包含所有有效人声片段起止时间戳的列表. For detailed input and output parameters, see
        <a href="https://github.com/volcengine/mcp-server/blob/main/server/mcp_server_mediakit/src/mediakit/mcp_tools/audio.py#L26">detect_voice_activity</a>.
      </td>
    </tr>
    <tr>
      <td>probe_audio_metadata</td>
      <td><b>Probe Audio Metadata</b>: 探测输入音频 URL，输出标准化媒资元信息，用于获取音频元信息. For detailed input and output parameters, see
        <a href="https://github.com/volcengine/mcp-server/blob/main/server/mcp_server_mediakit/src/mediakit/mcp_tools/audio.py#L44">probe_audio_metadata</a>.
      </td>
    </tr>
    <tr>
      <td>separate_voice</td>
      <td><b>Separate Voice</b>: 用于人声背景声分离，可将音频或视频文件中的人声与背景音精准分离，输出为两个独立的音频文件. For detailed input and output parameters, see
        <a href="https://github.com/volcengine/mcp-server/blob/main/server/mcp_server_mediakit/src/mediakit/mcp_tools/audio.py#L61">separate_voice</a>.
      </td>
    </tr>
    <tr>
      <td>transcode_audio</td>
      <td><b>Transcode Audio</b>: 音频转码将一个音频码流转换为另一个音频码流，通常涉及编码格式、编码参数和封装格式的转换，用于适应不同业务场景、播放终端和网络环境. For detailed input and output parameters, see
        <a href="https://github.com/volcengine/mcp-server/blob/main/server/mcp_server_mediakit/src/mediakit/mcp_tools/audio.py#L83">transcode_audio</a>.
      </td>
    </tr>
    <tr>
      <td rowspan="21"><b>Image processing</b></td>
      <td rowspan="21">image</td>
      <td>add_image_watermark</td>
      <td><b>Add Image Watermark</b>: 为图片添加图文明水印，适用于版权标识与素材分发防盗链场景. For detailed input and output parameters, see
        <a href="https://github.com/volcengine/mcp-server/blob/main/server/mcp_server_mediakit/src/mediakit/mcp_tools/image.py#L26">add_image_watermark</a>.
      </td>
    </tr>
    <tr>
      <td>adjust_image_color</td>
      <td><b>Adjust Image Color</b>: 对输入图像的亮度、对比度和饱和度进行调整，支持调亮、调暗、增强对比度、减弱对比度、增强饱和度、减弱饱和度共 6 种快速调整效果。适用于素材基础优化、统一内容视觉风格、营造庄重、复古等特殊氛围等场景. For detailed input and output parameters, see
        <a href="https://github.com/volcengine/mcp-server/blob/main/server/mcp_server_mediakit/src/mediakit/mcp_tools/image.py#L53">adjust_image_color</a>.
      </td>
    </tr>
    <tr>
      <td>compress_image</td>
      <td><b>Compress Image</b>: 支持一站式图像体积优化，覆盖压缩质量、文件体积上限、输出格式转换和 PNG 瘦身；适用于用户上传图片前的体积治理；适用于网站与 App 的图片分发加载优化；适用于 AIGC 与多模态模型的媒体预处理. For detailed input and output parameters, see
        <a href="https://github.com/volcengine/mcp-server/blob/main/server/mcp_server_mediakit/src/mediakit/mcp_tools/image.py#L69">compress_image</a>.
      </td>
    </tr>
    <tr>
      <td>crop_image</td>
      <td><b>Crop Image</b>: 对输入图像进行多模式裁剪，可执行方向裁剪、定向裁剪、自定义裁剪或内切圆裁剪，适用于多端尺寸适配、主体保留、商品图去边和指定区域截取. For detailed input and output parameters, see
        <a href="https://github.com/volcengine/mcp-server/blob/main/server/mcp_server_mediakit/src/mediakit/mcp_tools/image.py#L87">crop_image</a>.
      </td>
    </tr>
    <tr>
      <td>enhance_image</td>
      <td><b>Enhance Image</b>: 基于图像内容理解进行智能决策，提升图片的分辨率、清晰度与色彩表现. For detailed input and output parameters, see
        <a href="https://github.com/volcengine/mcp-server/blob/main/server/mcp_server_mediakit/src/mediakit/mcp_tools/image.py#L113">enhance_image</a>.
      </td>
    </tr>
    <tr>
      <td>erase_image</td>
      <td><b>Erase Image</b>: 可按不同场景控制自动检测并擦除图片中的文字或常见图标，擦除后的区域通过智能填充技术进行修复，修复后的区域与背景自然融合. For detailed input and output parameters, see
        <a href="https://github.com/volcengine/mcp-server/blob/main/server/mcp_server_mediakit/src/mediakit/mcp_tools/image.py#L131">erase_image</a>.
      </td>
    </tr>
    <tr>
      <td>evaluate_image_quality</td>
      <td><b>Evaluate Image Quality</b>: 用于图像画质评估，对输入图片进行主客观画质和美学评分，适用于质量监控、低质图筛查、内容审核、推荐排序和训练数据清洗. For detailed input and output parameters, see
        <a href="https://github.com/volcengine/mcp-server/blob/main/server/mcp_server_mediakit/src/mediakit/mcp_tools/image.py#L149">evaluate_image_quality</a>.
      </td>
    </tr>
    <tr>
      <td>face_blur_image</td>
      <td><b>Face Blur Image</b>: 自动检测图片中的所有人脸区域并进行马赛克处理，用于一键保护图片中的人脸隐私。支持社交平台内容审核、街景或监控画面脱敏、新闻媒体素材处理以及 AI 训练数据集脱敏等批量人脸隐私保护场景. For detailed input and output parameters, see
        <a href="https://github.com/volcengine/mcp-server/blob/main/server/mcp_server_mediakit/src/mediakit/mcp_tools/image.py#L165">face_blur_image</a>.
      </td>
    </tr>
    <tr>
      <td>flip_image</td>
      <td><b>Flip Image</b>: 支持对单张图片执行水平或竖直翻转. For detailed input and output parameters, see
        <a href="https://github.com/volcengine/mcp-server/blob/main/server/mcp_server_mediakit/src/mediakit/mcp_tools/image.py#L182">flip_image</a>.
      </td>
    </tr>
    <tr>
      <td>gaussian_blur_image</td>
      <td><b>Gaussian Blur Image</b>: 用于图像高斯模糊；通过设定模糊强度快速对图片进行模糊处理，适用于隐私信息弱化、背景氛围化、生成预览图及封面背景等场景. For detailed input and output parameters, see
        <a href="https://github.com/volcengine/mcp-server/blob/main/server/mcp_server_mediakit/src/mediakit/mcp_tools/image.py#L198">gaussian_blur_image</a>.
      </td>
    </tr>
    <tr>
      <td>image_ocr</td>
      <td><b>Image Ocr</b>: 用于通用印刷体文字识别（OCR），识别图片中的简体中文和英文，并提供文本块位置坐标与置信度参考. For detailed input and output parameters, see
        <a href="https://github.com/volcengine/mcp-server/blob/main/server/mcp_server_mediakit/src/mediakit/mcp_tools/image.py#L214">image_ocr</a>.
      </td>
    </tr>
    <tr>
      <td>invert_image</td>
      <td><b>Invert Image</b>: 用于图像负片，对输入图像执行负片（反相）效果，将图像的明暗关系与颜色映射为原图的相反效果，即明暗反转、色彩转为补色. For detailed input and output parameters, see
        <a href="https://github.com/volcengine/mcp-server/blob/main/server/mcp_server_mediakit/src/mediakit/mcp_tools/image.py#L228">invert_image</a>.
      </td>
    </tr>
    <tr>
      <td>mosaic_image</td>
      <td><b>Mosaic Image</b>: 支持对整张图像或指定矩形区域进行马赛克打码，可调整像素格形状与大小。支持用于遮挡人脸、证件信息、车牌、聊天记录等敏感内容. For detailed input and output parameters, see
        <a href="https://github.com/volcengine/mcp-server/blob/main/server/mcp_server_mediakit/src/mediakit/mcp_tools/image.py#L243">mosaic_image</a>.
      </td>
    </tr>
    <tr>
      <td>probe_image_metadata</td>
      <td><b>Probe Image Metadata</b>: 支持查询 metadata、avghue、alpha、blurhash 四种图像信息. For detailed input and output parameters, see
        <a href="https://github.com/volcengine/mcp-server/blob/main/server/mcp_server_mediakit/src/mediakit/mcp_tools/image.py#L263">probe_image_metadata</a>.
      </td>
    </tr>
    <tr>
      <td>remove_image_background</td>
      <td><b>Remove Image Background</b>: 自动识别并保留图像主体，移除背景后生成背景透明的图片，用于图像背景移除（抠图）. For detailed input and output parameters, see
        <a href="https://github.com/volcengine/mcp-server/blob/main/server/mcp_server_mediakit/src/mediakit/mcp_tools/image.py#L278">remove_image_background</a>.
      </td>
    </tr>
    <tr>
      <td>resize_image</td>
      <td><b>Resize Image</b>: 用于图像缩放，支持按指定宽高精确缩放，也可按长边、短边或等比模式缩放，适用于多端素材适配、封面与缩略图生成及批量图片预处理. For detailed input and output parameters, see
        <a href="https://github.com/volcengine/mcp-server/blob/main/server/mcp_server_mediakit/src/mediakit/mcp_tools/image.py#L298">resize_image</a>.
      </td>
    </tr>
    <tr>
      <td>rotate_image</td>
      <td><b>Rotate Image</b>: 通过设置旋转角度和旋转背景样式对图片进行旋转处理，适用于图片方向校正、创意编辑和批量图像处理. For detailed input and output parameters, see
        <a href="https://github.com/volcengine/mcp-server/blob/main/server/mcp_server_mediakit/src/mediakit/mcp_tools/image.py#L317">rotate_image</a>.
      </td>
    </tr>
    <tr>
      <td>round_corner_image</td>
      <td><b>Round Corner Image</b>: 为图片四角快速添加正圆或椭圆圆角，适用于头像、卡片、电商主图等常见视觉编辑场景. For detailed input and output parameters, see
        <a href="https://github.com/volcengine/mcp-server/blob/main/server/mcp_server_mediakit/src/mediakit/mcp_tools/image.py#L334">round_corner_image</a>.
      </td>
    </tr>
    <tr>
      <td>sharpen_image</td>
      <td><b>Sharpen Image</b>: 用于图像锐化，通过对输入图像进行锐化处理，有效增强图像的边缘细节与整体清晰度。适用于电商素材优化、UGC 画质增强、封面海报二创等场景. For detailed input and output parameters, see
        <a href="https://github.com/volcengine/mcp-server/blob/main/server/mcp_server_mediakit/src/mediakit/mcp_tools/image.py#L353">sharpen_image</a>.
      </td>
    </tr>
    <tr>
      <td>slim_image</td>
      <td><b>Slim Image</b>: 集智瘦身通过 AI 大幅缩小图片体积，修复毛刺、彩噪和块效应等问题，增强图像边缘与纹理细节，输出更轻量且更清晰的图片. For detailed input and output parameters, see
        <a href="https://github.com/volcengine/mcp-server/blob/main/server/mcp_server_mediakit/src/mediakit/mcp_tools/image.py#L369">slim_image</a>.
      </td>
    </tr>
    <tr>
      <td>smart_crop_image</td>
      <td><b>Smart Crop Image</b>: 自动识别图像中的主体人脸区域，并适配指定尺寸进行裁剪；支持普通人脸和动漫人脸场景。未识别到人脸时，可按预设的降级策略输出结果. For detailed input and output parameters, see
        <a href="https://github.com/volcengine/mcp-server/blob/main/server/mcp_server_mediakit/src/mediakit/mcp_tools/image.py#L384">smart_crop_image</a>.
      </td>
    </tr>
    <tr>
      <td rowspan="30"><b>Video AI</b></td>
      <td rowspan="30">video</td>
      <td>add_video_invisible_watermark</td>
      <td><b>Add Video Invisible Watermark</b>: 用于视频暗水印添加。在不影响视频画面视觉质量与完整性的前提下，将一串数字信息隐藏式地嵌入视频文件中。适用于视频版权保护、内容泄露溯源、文件真实性校验等场景. For detailed input and output parameters, see
        <a href="https://github.com/volcengine/mcp-server/blob/main/server/mcp_server_mediakit/src/mediakit/mcp_tools/video.py#L26">add_video_invisible_watermark</a>.
      </td>
    </tr>
    <tr>
      <td>analyze_video_highlights</td>
      <td><b>Analyze Video Highlights</b>: 支持短剧 Miniseries 和小游戏 Game 两种分析模型，用于高光片段提取，并输出精准时间戳、高光打分、OCR 文本和画面描述，供二次开发或内容分析. For detailed input and output parameters, see
        <a href="https://github.com/volcengine/mcp-server/blob/main/server/mcp_server_mediakit/src/mediakit/mcp_tools/video.py#L46">analyze_video_highlights</a>.
      </td>
    </tr>
    <tr>
      <td>analyze_video_storyline</td>
      <td><b>Analyze Video Storyline</b>: 用于剧情故事线分析，基于大模型视频理解分析单个或多个长视频并生成结构化剧情数据。分析结果包含两部分：按时间顺序排列的剧情片段，以及基于视频片段整理和归纳出的高光故事线. For detailed input and output parameters, see
        <a href="https://github.com/volcengine/mcp-server/blob/main/server/mcp_server_mediakit/src/mediakit/mcp_tools/video.py#L66">analyze_video_storyline</a>.
      </td>
    </tr>
    <tr>
      <td>asr_subtitles</td>
      <td><b>Asr Subtitles</b>: 从视频或音频的语音中识别并提取带时间戳的字幕文本；适用于提取视频字幕、语音转字幕、听写对白等诉求。识别对象是音轨中的语音内容，不是画面上已烧录的硬字幕. For detailed input and output parameters, see
        <a href="https://github.com/volcengine/mcp-server/blob/main/server/mcp_server_mediakit/src/mediakit/mcp_tools/video.py#L84">asr_subtitles</a>.
      </td>
    </tr>
    <tr>
      <td>assess_video_quality</td>
      <td><b>Assess Video Quality</b>: 用于视频画质检测. For detailed input and output parameters, see
        <a href="https://github.com/volcengine/mcp-server/blob/main/server/mcp_server_mediakit/src/mediakit/mcp_tools/video.py#L106">assess_video_quality</a>.
      </td>
    </tr>
    <tr>
      <td>drama_recap</td>
      <td><b>Drama Recap</b>: 将原始短剧/长剧/电影视频自动转化为带 AI 配音与解说字幕的全新视频。
自定义解说词或 AI 自动生成解说词、可选原字幕擦除。
. For detailed input and output parameters, see
        <a href="https://github.com/volcengine/mcp-server/blob/main/server/mcp_server_mediakit/src/mediakit/mcp_tools/video.py#L123">drama_recap</a>.
      </td>
    </tr>
    <tr>
      <td>drama_recap_vertical</td>
      <td><b>Drama Recap Vertical</b>: 支持基于输入短剧剧集的角色和剧情故事线理解（剧本还原），自动提取高光片段并生成全新的解说视频. For detailed input and output parameters, see
        <a href="https://github.com/volcengine/mcp-server/blob/main/server/mcp_server_mediakit/src/mediakit/mcp_tools/video.py#L149">drama_recap_vertical</a>.
      </td>
    </tr>
    <tr>
      <td>drama_script</td>
      <td><b>Drama Script</b>: 基于大模型视频理解能力，将短剧视频转化为结构化剧本文本，识别并提取场景、人物、对话和情节等核心元素. For detailed input and output parameters, see
        <a href="https://github.com/volcengine/mcp-server/blob/main/server/mcp_server_mediakit/src/mediakit/mcp_tools/video.py#L177">drama_script</a>.
      </td>
    </tr>
    <tr>
      <td>enhance_video</td>
      <td><b>Enhance Video</b>: AI-powered video quality enhancement and super-resolution for AIGC / UGC / short series / education / gaming / old-film restoration scenarios. For detailed input and output parameters, see
        <a href="https://github.com/volcengine/mcp-server/blob/main/server/mcp_server_mediakit/src/mediakit/mcp_tools/video.py#L195">enhance_video</a>.
      </td>
    </tr>
    <tr>
      <td>enhance_video_fast</td>
      <td><b>Enhance Video Fast</b>: 集成轻量级超分与智能画质增强，采用速度优先策略，高效兼顾处理效率与画面效果，尤其适用于处理时延敏感的业务场景. For detailed input and output parameters, see
        <a href="https://github.com/volcengine/mcp-server/blob/main/server/mcp_server_mediakit/src/mediakit/mcp_tools/video.py#L220">enhance_video_fast</a>.
      </td>
    </tr>
    <tr>
      <td>enhance_video_generative</td>
      <td><b>Enhance Video Generative</b>: 基于 Diffusion 扩散大模型技术提供生成式视频增强与修复，通过深度语义理解，智能补全和生成符合视频内容的真实细节，可修复视频在压缩或老化过程中损失的像素，最终产出自然、高保真的视频画面. For detailed input and output parameters, see
        <a href="https://github.com/volcengine/mcp-server/blob/main/server/mcp_server_mediakit/src/mediakit/mcp_tools/video.py#L242">enhance_video_generative</a>.
      </td>
    </tr>
    <tr>
      <td>erase_video_subtitle</td>
      <td><b>Erase Video Subtitle</b>: 智能检测并擦除视频画面中已有的硬字幕，保留原始背景；仅处理字幕，不支持水印擦除. For detailed input and output parameters, see
        <a href="https://github.com/volcengine/mcp-server/blob/main/server/mcp_server_mediakit/src/mediakit/mcp_tools/video.py#L263">erase_video_subtitle</a>.
      </td>
    </tr>
    <tr>
      <td>erase_video_subtitle_pro</td>
      <td><b>Erase Video Subtitle Pro</b>: High-quality, traceless removal of subtitles from a video while preserving the original picture as much as possible. For detailed input and output parameters, see
        <a href="https://github.com/volcengine/mcp-server/blob/main/server/mcp_server_mediakit/src/mediakit/mcp_tools/video.py#L281">erase_video_subtitle_pro</a>.
      </td>
    </tr>
    <tr>
      <td>extract_frames</td>
      <td><b>Extract Frames</b>: 从视频中抽取截图，截图结果支持用于视频封面、预览图、雪碧图或其他视频理解任务的输入. For detailed input and output parameters, see
        <a href="https://github.com/volcengine/mcp-server/blob/main/server/mcp_server_mediakit/src/mediakit/mcp_tools/video.py#L305">extract_frames</a>.
      </td>
    </tr>
    <tr>
      <td>extract_video_invisible_watermark</td>
      <td><b>Extract Video Invisible Watermark</b>: 从已嵌入暗水印的视频中解析并还原隐藏的数字信息；如果同一视频被多次嵌入暗水印，也能够提取出所有水印信息. For detailed input and output parameters, see
        <a href="https://github.com/volcengine/mcp-server/blob/main/server/mcp_server_mediakit/src/mediakit/mcp_tools/video.py#L333">extract_video_invisible_watermark</a>.
      </td>
    </tr>
    <tr>
      <td>face_blur_video</td>
      <td><b>Face Blur Video</b>: 视频人脸打码可自动精准识别视频画面中的人脸区域，并对所有人脸进行模糊或马赛克处理，适用于需要保护人物五官隐私的场景. For detailed input and output parameters, see
        <a href="https://github.com/volcengine/mcp-server/blob/main/server/mcp_server_mediakit/src/mediakit/mcp_tools/video.py#L348">face_blur_video</a>.
      </td>
    </tr>
    <tr>
      <td>face_swap_video</td>
      <td><b>Face Swap Video</b>: 将用户提供的目标人脸融合替换到视频中的人物上，输出高质量换脸视频，主要适用于生成式视频脱敏需要换脸的场景. For detailed input and output parameters, see
        <a href="https://github.com/volcengine/mcp-server/blob/main/server/mcp_server_mediakit/src/mediakit/mcp_tools/video.py#L371">face_swap_video</a>.
      </td>
    </tr>
    <tr>
      <td>generate_highlights_microdrama</td>
      <td><b>Generate Highlights Microdrama</b>: 可用于短剧高光智剪，基于输入剧集的角色和剧情故事线理解提取高光片段，并按时长、产出个数、顺剪或跳剪等要求生成高光混剪、单集预告等视频. For detailed input and output parameters, see
        <a href="https://github.com/volcengine/mcp-server/blob/main/server/mcp_server_mediakit/src/mediakit/mcp_tools/video.py#L390">generate_highlights_microdrama</a>.
      </td>
    </tr>
    <tr>
      <td>generate_highlights_minigame</td>
      <td><b>Generate Highlights Minigame</b>: 支持识别小游戏录屏视频中的核心玩法与高光事件，例如连击、通关、极限操作，并快速生成用于买量推广的视频素材。可选提供游戏名称、玩法描述和高光定义，辅助更精准地识别精彩内容. For detailed input and output parameters, see
        <a href="https://github.com/volcengine/mcp-server/blob/main/server/mcp_server_mediakit/src/mediakit/mcp_tools/video.py#L416">generate_highlights_minigame</a>.
      </td>
    </tr>
    <tr>
      <td>generate_highlights_movie</td>
      <td><b>Generate Highlights Movie</b>: 支持面向电影、电视剧等长视频内容，按剧情故事线识别高光并拆分成多段指定时长的高光片段，用于影视合集分发的短视频素材；算法会识别并去除景色铺垫、缓慢运镜、片头片尾曲等低密度信息；每段拆条带有高光前置开场与结尾钩子设计. For detailed input and output parameters, see
        <a href="https://github.com/volcengine/mcp-server/blob/main/server/mcp_server_mediakit/src/mediakit/mcp_tools/video.py#L437">generate_highlights_movie</a>.
      </td>
    </tr>
    <tr>
      <td>martencode_video</td>
      <td><b>Martencode Video</b>: 极智超清在转码时智能分析视频的场景、动作、内容和纹理，选择最优编码参数，以相对较低码率输出主观画质更优的视频，降低带宽成本并改善用户视觉体验. For detailed input and output parameters, see
        <a href="https://github.com/volcengine/mcp-server/blob/main/server/mcp_server_mediakit/src/mediakit/mcp_tools/video.py#L458">martencode_video</a>.
      </td>
    </tr>
    <tr>
      <td>matte_greenscreen_video</td>
      <td><b>Matte Greenscreen Video</b>: 可对绿幕或纯色背景的视频进行抠图，自动识别并保留主体，最终生成背景透明或纯色背景的视频. For detailed input and output parameters, see
        <a href="https://github.com/volcengine/mcp-server/blob/main/server/mcp_server_mediakit/src/mediakit/mcp_tools/video.py#L481">matte_greenscreen_video</a>.
      </td>
    </tr>
    <tr>
      <td>matte_portrait_video</td>
      <td><b>Matte Portrait Video</b>: 自动识别视频中的人物主体，移除原始背景，并生成背景透明或纯色背景的视频文件，适用于背景替换等后期处理场景. For detailed input and output parameters, see
        <a href="https://github.com/volcengine/mcp-server/blob/main/server/mcp_server_mediakit/src/mediakit/mcp_tools/video.py#L501">matte_portrait_video</a>.
      </td>
    </tr>
    <tr>
      <td>probe_video_metadata</td>
      <td><b>Probe Video Metadata</b>: 探测输入的视频 URL，输出标准化的媒资元信息. For detailed input and output parameters, see
        <a href="https://github.com/volcengine/mcp-server/blob/main/server/mcp_server_mediakit/src/mediakit/mcp_tools/video.py#L521">probe_video_metadata</a>.
      </td>
    </tr>
    <tr>
      <td>remux_video</td>
      <td><b>Remux Video</b>: 视频转封装用于调整视频容器格式，仅修改容器格式，不会重新编解码音视频码流，适用于点播分发适配、流媒体切片打包与多端兼容等场景. For detailed input and output parameters, see
        <a href="https://github.com/volcengine/mcp-server/blob/main/server/mcp_server_mediakit/src/mediakit/mcp_tools/video.py#L536">remux_video</a>.
      </td>
    </tr>
    <tr>
      <td>segment_scenes</td>
      <td><b>Segment Scenes</b>: 依据视频的转场和画面内容变化自动切分多个场景片段，输出每个场景片段的时间轴信息与对应的独立视频文件. For detailed input and output parameters, see
        <a href="https://github.com/volcengine/mcp-server/blob/main/server/mcp_server_mediakit/src/mediakit/mcp_tools/video.py#L557">segment_scenes</a>.
      </td>
    </tr>
    <tr>
      <td>semantic_segment</td>
      <td><b>Semantic Segment</b>: 综合分析视频的画面、语音和叙事结构，通过镜头切换、语音停顿检测等策略，在保证语义完整、避免将单句从中间切断的前提下，将长视频智能地切分为多个独立的素材片段. For detailed input and output parameters, see
        <a href="https://github.com/volcengine/mcp-server/blob/main/server/mcp_server_mediakit/src/mediakit/mcp_tools/video.py#L579">semantic_segment</a>.
      </td>
    </tr>
    <tr>
      <td>transcode_video</td>
      <td><b>Transcode Video</b>: 视频转码将视频码流转换为另一视频码流，可涉及编码格式、分辨率、码率、I 帧间隔和封装格式转换，用于适应不同业务场景、播放终端和网络环境. For detailed input and output parameters, see
        <a href="https://github.com/volcengine/mcp-server/blob/main/server/mcp_server_mediakit/src/mediakit/mcp_tools/video.py#L600">transcode_video</a>.
      </td>
    </tr>
    <tr>
      <td>video_ocr</td>
      <td><b>Video Ocr</b>: 用于视频字幕识别（OCR），识别输入视频画面中的字幕信息，输出带时间戳的结构化文本数据. For detailed input and output parameters, see
        <a href="https://github.com/volcengine/mcp-server/blob/main/server/mcp_server_mediakit/src/mediakit/mcp_tools/video.py#L623">video_ocr</a>.
      </td>
    </tr>
    <tr>
      <td>video_understand_router</td>
      <td><b>Video Understand Router</b>: 基于视觉大模型，对输入的视频 URL 列表进行通用视频内容分析，输出视频级别的结构化理解结果，适用于内容审核、视频检索、标签生成等场景. For detailed input and output parameters, see
        <a href="https://github.com/volcengine/mcp-server/blob/main/server/mcp_server_mediakit/src/mediakit/mcp_tools/video.py#L641">video_understand_router</a>.
      </td>
    </tr>
  </tbody>
</table>

# Quick Start in Trae

Trae is an AI-native IDE with strong agent collaboration capabilities. By connecting MediaKit MCP, you can call cloud media processing capabilities in Trae with natural language and quickly complete tasks such as video editing, subtitle processing, audio processing, and video enhancement.

## Prerequisites

- Prepare a valid MediaKit API key.
- Confirm the MediaKit service endpoint. If not explicitly configured, the default is `https://mediakit.cn-beijing.volces.com`.
- Install the [Trae client](https://www.trae.com.cn/).
- For local mode or self-hosted cloud mode, make sure `uvx` is installed in your local environment. Run `uvx --version` to check. If it is not installed, follow the [uv installation guide](https://docs.astral.sh/uv/getting-started/installation/).

## Steps

### Step 1: Choose an Access Mode

Choose one of the following modes based on your usage scenario:

| Mode                        | Best for                                                           | Access method                                                                                  |
| --------------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| **Local Mode (JSON Local)** | Personal debugging, quick trials, no self-hosted service required. | Use `uvx` to launch MediaKit MCP directly from the `mcp-server` repository subdirectory.       |
| **Cloud Mode (JSON URL)**   | Team sharing, long-term usage, centralized operations.             | Deploy MediaKit MCP Server yourself, then connect using the deployed Streamable HTTP endpoint. |

### Step 2: Add MCP Configuration

1. Open Trae and click the settings button in the top-right corner.
2. In the MCP tab, click **Add** > **Add Manually**.
3. Copy the JSON configuration for your selected mode and replace the fields as described below.

#### Local Mode (JSON Local)

Copy the following JSON and replace the fields as needed. Trae uses `uvx` to fetch the remote code and run it locally.

```json
{
  "mcpServers": {
    "mediakit_mcp": {
      "command": "uvx",
      "args": [
        "--from",
        "git+https://github.com/volcengine/mcp-server.git#subdirectory=server/mcp_server_mediakit",
        "mcp-server-mediakit"
      ],
      "env": {
        "MEDIAKIT_API_KEY": "your-api-key",
        "MCP_DOMAINS": "editing,video"
      }
    }
  }
}
```

**Field replacement notes:**

- `mediakit_mcp`: The MCP service name. You can customize it.
- `MEDIAKIT_API_KEY`: Replace with your MediaKit API key.
- `MEDIAKIT_ENDPOINT`: Optional MediaKit service endpoint override. Omit it to use `https://mediakit.cn-beijing.volces.com`.
- `MCP_DOMAINS`: Load tools by group, for example `editing,video`. To load tools by exact tool name, use `MCP_TOOLS` instead.

To load by tool name, use a configuration like this:

```json
{
  "mcpServers": {
    "mediakit_mcp": {
      "command": "uvx",
      "args": [
        "--from",
        "git+https://github.com/volcengine/mcp-server.git#subdirectory=server/mcp_server_mediakit",
        "mcp-server-mediakit"
      ],
      "env": {
        "MEDIAKIT_API_KEY": "your-api-key",
        "MCP_TOOLS": "trim_video,query_task"
      }
    }
  }
}
```

#### Cloud Mode (JSON URL)

Cloud mode does not provide a prebuilt deployment URL. Before using this mode, you need to deploy MediaKit MCP Server yourself and make sure the service is reachable through Streamable HTTP. After deployment, record the service URL, for example `https://your-domain/mcp`, and then connect it in Trae as shown below.

A simple startup example is:

```bash
# Multi-tenant: do not set a shared MEDIAKIT_API_KEY on the server
export MCP_SERVER_HOST="0.0.0.0"
export MCP_SERVER_PORT="8000"
export STREAMABLE_HTTP_PATH="/mcp"
export STATLESS_HTTP="true"

uvx --from "git+https://github.com/volcengine/mcp-server.git#subdirectory=server/mcp_server_mediakit" mcp-server-mediakit --transport streamable-http
```

For local development from source:

```bash
cd mcp_server_mediakit
uv sync
# Optional for single-tenant local testing only
# export MEDIAKIT_API_KEY="your-api-key"
uv run mcp-server-mediakit --transport streamable-http
```

After deployment, copy the following JSON and replace the fields as needed:

```json
{
  "mcpServers": {
    "mediakit_mcp": {
      "url": "https://your-domain/mcp",
      "headers": {
        "x-amk-api-key": "your-api-key",
        "x-mcp-domains": "editing,video"
      }
    }
  }
}
```

**Field replacement notes:**

- `mediakit_mcp`: The MCP service name. You can customize it.
- `url`: Replace with your self-hosted MediaKit MCP Streamable HTTP URL, such as `https://your-domain/mcp`.
- `x-amk-api-key`: MediaKit API key for cloud HTTP mode. **Header takes precedence** over the server process `MEDIAKIT_API_KEY`. Omit it only when the server already has a single-tenant key in the environment.
- `x-mcp-domains`: Load tools by group, for example `editing,video`. To load tools by exact tool name, use `x-mcp-tools` instead.

To load by tool name, use a configuration like this:

```json
{
  "mcpServers": {
    "mediakit_mcp": {
      "url": "https://your-domain/mcp",
      "headers": {
        "x-amk-api-key": "your-api-key",
        "x-mcp-tools": "trim_video,query_task"
      }
    }
  }
}
```

4. Make sure the MCP status is shown as active in Trae.

### Step 3: Start Agent Conversations

Open the chat panel in Trae and switch the agent mode to one that supports MCP. Then you can directly issue natural language instructions such as:

- Trim this video to the first 10 seconds and output a new video.
- Add Chinese subtitles to this video with font size 28.
- Remove the subtitles at the bottom of this video, then enhance the processed video quality.
- Concatenate these two audio files, and if the task is asynchronous, continue querying until the final result is ready.

## Usage Notes

- Synchronous tasks return results directly.
- Asynchronous tasks return a `task_id`, and you need to call `query_task` to get task status and results.
- Normal calls omit `client_token`; the runtime only forwards a value explicitly supplied by the caller.
- For an explicit retry of the same logical request, reuse the same `client_token`. Changed business parameters start a new logical request.
- The MCP runtime does not infer retry intent or generate `client_token`.

## MCP Configuration Reference

The table below lists the core MediaKit MCP configuration fields for cloud mode and local mode.

<table>
  <thead>
    <tr>
      <th>Cloud header</th>
      <th>Local environment variable</th>
      <th>Example</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>-</td>
      <td>MEDIAKIT_API_KEY</td>
      <td>your-api-key</td>
      <td>Required for stdio/local mode. Not used as the primary credential in cloud HTTP mode.</td>
    </tr>
    <tr>
      <td>x-amk-api-key</td>
      <td>-</td>
      <td>your-api-key</td>
      <td><b>Cloud HTTP:</b> per-tenant key via `x-amk-api-key`. If omitted, falls back to the server process `MEDIAKIT_API_KEY` for single-tenant deployments.</td>
    </tr>
    <tr>
      <td>x-mediakit-endpoint</td>
      <td>MEDIAKIT_ENDPOINT</td>
      <td>https://mediakit.cn-beijing.volces.com</td>
      <td>Optional MediaKit endpoint override. Header takes precedence over the process environment variable.</td>
    </tr>
    <tr>
      <td>x-mcp-domains</td>
      <td>MCP_DOMAINS</td>
      <td>editing,video</td>
      <td>Load tools by group. Separate multiple groups with commas. Applies to both listing and calling tools. The `shared` group is always loaded.</td>
    </tr>
    <tr>
      <td>x-mcp-tools</td>
      <td>MCP_TOOLS</td>
      <td>trim_video,query_task</td>
      <td>Load tools by tool name. Separate multiple tool names with commas. Applies to both listing and calling tools.</td>
    </tr>
  </tbody>
</table>

For self-hosted cloud mode, you can also configure the following startup parameters:

| Environment variable   | Default value | Description                                      |
| ---------------------- | ------------- | ------------------------------------------------ |
| `MCP_SERVER_HOST`      | `0.0.0.0`     | MCP service bind address.                        |
| `MCP_SERVER_PORT`      | `8000`        | MCP service listening port.                      |
| `STREAMABLE_HTTP_PATH` | `/mcp`        | Streamable HTTP path.                            |
| `STATLESS_HTTP`        | `true`        | Whether to run Streamable HTTP in stateless mode. |

## Tool Details

### Shared (`shared`)

#### query_task

查询异步任务状态。提交异步任务后使用此工具获取结果。推荐使用 poll_interval_seconds + max_poll_attempts 控制轮询，例如 poll_interval_seconds=2、max_poll_attempts=10。传递这两个参数时，不需要再传 poll_complete【不推荐】。可选 max_poll_timeout_seconds 限制单次轮询总时长，默认 0 表示不限制；poll_interval_seconds × max_poll_attempts 不得超过该上限。

### Video editing (`editing`)

#### add_image_to_video

支持将指定图片（如 Logo、水印等）叠加到视频画面上。

#### add_subtitle_to_video

将字幕文件或文本内容按自定义样式压制到视频画面中，生成带内嵌字幕的新视频。

#### adjust_audio_speed

用于音频调速，可调整音频播放倍速，实现快放或慢放效果。

#### adjust_video_speed

用于视频调速，通过调整播放倍速产生快放或慢放效果。

#### adjust_video_volume

用于调整输入视频的音量大小，也可实现静音。

#### apply_camera_motion

对输入视频在指定时间段内添加一种运镜特效，常用于素材二次创作、营销片头、短剧动效等场景。

#### apply_video_filter

为指定视频添加滤镜效果。

#### concat_audio

拼接多个音频片段。

#### concat_video

将多个视频按顺序拼接成一个完整的视频文件，并支持在拼接处添加转场效果。

#### crop_video

按指定的矩形区域裁剪视频画面，裁剪结果仅保留指定的需要区域。

#### extract_animated_image

从视频中按指定开始时间和结束时间截取一段画面，生成 GIF 或 WebP 动图，常用于制作封面动图、营销素材和短预览。

#### extract_audio

从输入视频文件中分离音轨，生成独立的音频文件。

#### fade_audio

对输入音频的起止位置实现淡入或淡出效果，输出处理后的音频文件。

#### fade_video_audio

在片头或片尾对输入视频音轨执行淡入或淡出处理，用于弱化音轨突兀的起止，提升成片听感。输出处理后的视频文件。

#### flip_video

用于视频画面翻转，对指定视频进行上下或左右镜像翻转。

#### image_to_video

将多张图片按顺序组合成动态视频，可配置转场动画和镜头内动画；仅把现有图片做成带动效的视频，不支持根据参考图生成新的画面内容。

#### mix_audio

将多个音频文件（如背景音乐、音效、人声）进行混音，生成一个新的音频文件。
处理耗时：处理耗时与视频时长正相关。视频时长越长，处理耗时越长。平均 RTF（处理耗时/原片时长）为 1。
输出音频的时长以最长的音频为准。
输出视频格式：mp3

#### mux_audio_video

可将输入的音频流与视频流合并成一个新的视频文件，并可选择保留或替换视频的原有音轨；当音视频时长不一致时，可进行对齐处理。

#### rotate_video

用于视频画面旋转，对指定视频进行整体旋转。

#### stitch_video

将多个视频在空间上按水平或垂直方向拼接成一个完整画面，适用于多视角对比、画面组合等场景。

#### text_to_scrolling_video

将指定文本内容转换为文字滚屏视频，输出视频为固定 9:16 竖版，常用于小说推文、内容讲解和歌词视频等场景。

#### trim_audio

用于音频裁剪，按指定的开始时间和结束时间从输入音频中截取片段。

#### trim_video

用于视频裁剪，可按指定的开始和结束时间从输入视频截取片段。

### Audio processing (`audio`)

#### detect_voice_activity

用于语音端点识别。自动定位音频或视频文件中有效语音的起止时间。将人声和静音、背景噪声等无效片段区分开来。返回包含所有有效人声片段起止时间戳的列表。

#### probe_audio_metadata

探测输入音频 URL，输出标准化媒资元信息，用于获取音频元信息。

#### separate_voice

用于人声背景声分离，可将音频或视频文件中的人声与背景音精准分离，输出为两个独立的音频文件。

#### transcode_audio

音频转码将一个音频码流转换为另一个音频码流，通常涉及编码格式、编码参数和封装格式的转换，用于适应不同业务场景、播放终端和网络环境。

### Image processing (`image`)

#### add_image_watermark

为图片添加图文明水印，适用于版权标识与素材分发防盗链场景。

#### adjust_image_color

对输入图像的亮度、对比度和饱和度进行调整，支持调亮、调暗、增强对比度、减弱对比度、增强饱和度、减弱饱和度共 6 种快速调整效果。适用于素材基础优化、统一内容视觉风格、营造庄重、复古等特殊氛围等场景。

#### compress_image

支持一站式图像体积优化，覆盖压缩质量、文件体积上限、输出格式转换和 PNG 瘦身；适用于用户上传图片前的体积治理；适用于网站与 App 的图片分发加载优化；适用于 AIGC 与多模态模型的媒体预处理。

#### crop_image

对输入图像进行多模式裁剪，可执行方向裁剪、定向裁剪、自定义裁剪或内切圆裁剪，适用于多端尺寸适配、主体保留、商品图去边和指定区域截取。

#### enhance_image

基于图像内容理解进行智能决策，提升图片的分辨率、清晰度与色彩表现。

#### erase_image

可按不同场景控制自动检测并擦除图片中的文字或常见图标，擦除后的区域通过智能填充技术进行修复，修复后的区域与背景自然融合。

#### evaluate_image_quality

用于图像画质评估，对输入图片进行主客观画质和美学评分，适用于质量监控、低质图筛查、内容审核、推荐排序和训练数据清洗。

#### face_blur_image

自动检测图片中的所有人脸区域并进行马赛克处理，用于一键保护图片中的人脸隐私。支持社交平台内容审核、街景或监控画面脱敏、新闻媒体素材处理以及 AI 训练数据集脱敏等批量人脸隐私保护场景。

#### flip_image

支持对单张图片执行水平或竖直翻转。

#### gaussian_blur_image

用于图像高斯模糊；通过设定模糊强度快速对图片进行模糊处理，适用于隐私信息弱化、背景氛围化、生成预览图及封面背景等场景。

#### image_ocr

用于通用印刷体文字识别（OCR），识别图片中的简体中文和英文，并提供文本块位置坐标与置信度参考。

#### invert_image

用于图像负片，对输入图像执行负片（反相）效果，将图像的明暗关系与颜色映射为原图的相反效果，即明暗反转、色彩转为补色。

#### mosaic_image

支持对整张图像或指定矩形区域进行马赛克打码，可调整像素格形状与大小。支持用于遮挡人脸、证件信息、车牌、聊天记录等敏感内容。

#### probe_image_metadata

支持查询 metadata、avghue、alpha、blurhash 四种图像信息。

#### remove_image_background

自动识别并保留图像主体，移除背景后生成背景透明的图片，用于图像背景移除（抠图）。

#### resize_image

用于图像缩放，支持按指定宽高精确缩放，也可按长边、短边或等比模式缩放，适用于多端素材适配、封面与缩略图生成及批量图片预处理。

#### rotate_image

通过设置旋转角度和旋转背景样式对图片进行旋转处理，适用于图片方向校正、创意编辑和批量图像处理。

#### round_corner_image

为图片四角快速添加正圆或椭圆圆角，适用于头像、卡片、电商主图等常见视觉编辑场景。

#### sharpen_image

用于图像锐化，通过对输入图像进行锐化处理，有效增强图像的边缘细节与整体清晰度。适用于电商素材优化、UGC 画质增强、封面海报二创等场景。

#### slim_image

集智瘦身通过 AI 大幅缩小图片体积，修复毛刺、彩噪和块效应等问题，增强图像边缘与纹理细节，输出更轻量且更清晰的图片。

#### smart_crop_image

自动识别图像中的主体人脸区域，并适配指定尺寸进行裁剪；支持普通人脸和动漫人脸场景。未识别到人脸时，可按预设的降级策略输出结果。

### Video AI (`video`)

#### add_video_invisible_watermark

用于视频暗水印添加。在不影响视频画面视觉质量与完整性的前提下，将一串数字信息隐藏式地嵌入视频文件中。适用于视频版权保护、内容泄露溯源、文件真实性校验等场景。

#### analyze_video_highlights

支持短剧 Miniseries 和小游戏 Game 两种分析模型，用于高光片段提取，并输出精准时间戳、高光打分、OCR 文本和画面描述，供二次开发或内容分析。

#### analyze_video_storyline

用于剧情故事线分析，基于大模型视频理解分析单个或多个长视频并生成结构化剧情数据。分析结果包含两部分：按时间顺序排列的剧情片段，以及基于视频片段整理和归纳出的高光故事线。

#### asr_subtitles

从视频或音频的语音中识别并提取带时间戳的字幕文本；适用于提取视频字幕、语音转字幕、听写对白等诉求。识别对象是音轨中的语音内容，不是画面上已烧录的硬字幕。

#### assess_video_quality

用于视频画质检测。

#### drama_recap

将原始短剧/长剧/电影视频自动转化为带 AI 配音与解说字幕的全新视频。
自定义解说词或 AI 自动生成解说词、可选原字幕擦除。


#### drama_recap_vertical

支持基于输入短剧剧集的角色和剧情故事线理解（剧本还原），自动提取高光片段并生成全新的解说视频。

#### drama_script

基于大模型视频理解能力，将短剧视频转化为结构化剧本文本，识别并提取场景、人物、对话和情节等核心元素。

#### enhance_video

用于视频画质增强。利用 AI 算法对输入视频进行分析，并智能执行包括但不限于视频去噪、色彩增强、清晰度提升、瑕疵修复和超分辨率的一系列优化操作。提供 standard 和 professional 两种版本：standard 兼顾处理速度与视频画质，内置高频使用的 10 余种增强算法，适用于视频分发场景的画质增强；professional 提供极致画质增强，内置 30 余种深度 AI 增强算法，适用于影视级视频制作。不同版本会影响增强算法的强度、适用场景与计费。

#### enhance_video_fast

集成轻量级超分与智能画质增强，采用速度优先策略，高效兼顾处理效率与画面效果，尤其适用于处理时延敏感的业务场景。

#### enhance_video_generative

基于 Diffusion 扩散大模型技术提供生成式视频增强与修复，通过深度语义理解，智能补全和生成符合视频内容的真实细节，可修复视频在压缩或老化过程中损失的像素，最终产出自然、高保真的视频画面。

#### erase_video_subtitle

智能检测并擦除视频画面中已有的硬字幕，保留原始背景；仅处理字幕，不支持水印擦除。

#### erase_video_subtitle_pro

用于字幕擦除（精细化版），对视频字幕进行高质量无痕擦除，并最大程度还原视频画面。

#### extract_frames

从视频中抽取截图，截图结果支持用于视频封面、预览图、雪碧图或其他视频理解任务的输入。

#### extract_video_invisible_watermark

从已嵌入暗水印的视频中解析并还原隐藏的数字信息；如果同一视频被多次嵌入暗水印，也能够提取出所有水印信息。

#### face_blur_video

视频人脸打码可自动精准识别视频画面中的人脸区域，并对所有人脸进行模糊或马赛克处理，适用于需要保护人物五官隐私的场景。

#### face_swap_video

将用户提供的目标人脸融合替换到视频中的人物上，输出高质量换脸视频，主要适用于生成式视频脱敏需要换脸的场景。

#### generate_highlights_microdrama

可用于短剧高光智剪，基于输入剧集的角色和剧情故事线理解提取高光片段，并按时长、产出个数、顺剪或跳剪等要求生成高光混剪、单集预告等视频。

#### generate_highlights_minigame

支持识别小游戏录屏视频中的核心玩法与高光事件，例如连击、通关、极限操作，并快速生成用于买量推广的视频素材。可选提供游戏名称、玩法描述和高光定义，辅助更精准地识别精彩内容。

#### generate_highlights_movie

支持面向电影、电视剧等长视频内容，按剧情故事线识别高光并拆分成多段指定时长的高光片段，用于影视合集分发的短视频素材；算法会识别并去除景色铺垫、缓慢运镜、片头片尾曲等低密度信息；每段拆条带有高光前置开场与结尾钩子设计。

#### martencode_video

极智超清在转码时智能分析视频的场景、动作、内容和纹理，选择最优编码参数，以相对较低码率输出主观画质更优的视频，降低带宽成本并改善用户视觉体验。

#### matte_greenscreen_video

可对绿幕或纯色背景的视频进行抠图，自动识别并保留主体，最终生成背景透明或纯色背景的视频。

#### matte_portrait_video

自动识别视频中的人物主体，移除原始背景，并生成背景透明或纯色背景的视频文件，适用于背景替换等后期处理场景。

#### probe_video_metadata

探测输入的视频 URL，输出标准化的媒资元信息。

#### remux_video

视频转封装用于调整视频容器格式，仅修改容器格式，不会重新编解码音视频码流，适用于点播分发适配、流媒体切片打包与多端兼容等场景。

#### segment_scenes

依据视频的转场和画面内容变化自动切分多个场景片段，输出每个场景片段的时间轴信息与对应的独立视频文件。

#### semantic_segment

综合分析视频的画面、语音和叙事结构，通过镜头切换、语音停顿检测等策略，在保证语义完整、避免将单句从中间切断的前提下，将长视频智能地切分为多个独立的素材片段。

#### transcode_video

视频转码将视频码流转换为另一视频码流，可涉及编码格式、分辨率、码率、I 帧间隔和封装格式转换，用于适应不同业务场景、播放终端和网络环境。

#### video_ocr

用于视频字幕识别（OCR），识别输入视频画面中的字幕信息，输出带时间戳的结构化文本数据。

#### video_understand_router

基于视觉大模型，对输入的视频 URL 列表进行通用视频内容分析，输出视频级别的结构化理解结果，适用于内容审核、视频检索、标签生成等场景。


## License

MIT
