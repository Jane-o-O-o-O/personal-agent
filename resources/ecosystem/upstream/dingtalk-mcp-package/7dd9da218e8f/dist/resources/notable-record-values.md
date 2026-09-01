# 记录值格式
该文档介绍AI表格中记录值的读写格式。

不同字段类型所使用的格式请参考下表：

| 字段名 | 类型 (type) | 设置值（新增/更新记录时使用的格式） |
| --- | --- |------------------------------------------------------------------------------------|
| 文本  | text | `"TextString" // 字符串`                                                                                  |
| 数字  | number | `123 // 支持整数/浮点数/字符串`                                                                                                      |
| 单选  | singleSelect | `"optionName1" // 单选选项名`                      |
| 多选  | multipleSelect | `["optionName1", "optionName2"] // 多选选项名`                       |
| 日期  | date | `1688601600000 // 时间戳 "2023-12-20 03:00" // 或者 ISO 8601字符串`                        |
| 人员  | user | `[   {     unionId: "xxx"   } ]`  |
| 部门  | department | `[   {     deptId: "xxx"   } ]`  |
| 附件  | attachment | 具体请参考[上传附件](https://open.dingtalk.com/document/orgapp/notable-upload-attachment) 。                                            |
| 单向关联 | unidirectionalLink | `{     "linkedRecordIds": [         "xxx",         "yyy"     ] }`                                                       |
| 双向关联 | bidirectionalLink | `{     "linkedRecordIds": [         "xxx",         "yyy"     ] }`                                                        |
| 链接  | url | `{   "text": "Dingtalk",   "link": "https://dingtalk.com" }`                                                                    |