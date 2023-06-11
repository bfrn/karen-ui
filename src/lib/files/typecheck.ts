import { FileType } from "./types";

export function checkFileType(jsonString: string): FileType {
  try {
    const jsonObject = JSON.parse(jsonString);
    
    if ('_root' in jsonObject) {
      return FileType.Karen;
    } else if ('planned_values' in jsonObject) {
      return FileType.Plan;
    } else if ('values'){
        return FileType.State
    }  else {
      // Unknown file type
      return FileType.Undefined;
    }
  } catch (error) {
    // Invalid JSON string
    return FileType.Undefined;
  }
}
