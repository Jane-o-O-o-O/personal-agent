import {DateUtils} from './DateUtils.js'
import {FileUtils} from './file.js'

const localTools = ["currentDateTime", "notableSupportedSearchFilters", "notableSupportedFieldInfo", "notableRecordValuesFormat"]

export class LocalTools{

    static isLocalTool(toolName){
        return localTools.includes(toolName)
    }

    static callTool(tool){
        if (tool.name === "currentDateTime"){
            return DateUtils.getFormattedLocalNow();
        }else if (tool.name === "notableSupportedSearchFilters" || tool.name === "notableSupportedFieldInfo" || tool.name === "notableRecordValuesFormat"){
            return FileUtils.readLocalFileContent(tool);
        }
    }

}