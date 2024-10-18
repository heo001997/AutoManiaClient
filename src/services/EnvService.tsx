import { Dataset } from "@/types/Dataset";

export class EnvService {
  private datasets: Dataset[];

  constructor(datasets: Dataset[]) {
    this.datasets = datasets;
  }

  getRealValue(runnerData: any, idx: number, datasetIdMap: Record<string, string>): string {
    const currRunnerData = runnerData[idx];
    
    if (currRunnerData.type === "dataset" && currRunnerData.value !== "") {
      const datasetId = currRunnerData.value;

      const matchDataset = this.datasets.find((dataset) => dataset.id.toString() === datasetId)
      if (!matchDataset) return '';

      const matchingDatasetIndex = parseInt(datasetIdMap[datasetId]);
      if (isNaN(matchingDatasetIndex)) return '';

      const realValue = matchDataset.data[matchingDatasetIndex];

      if (typeof realValue === 'object') {
        return JSON.stringify(realValue || '');
      }
      return realValue || '';
    } else if (currRunnerData.type === "variable") {
      return this.getVariableRealValue(runnerData, currRunnerData.value, datasetIdMap);
    }
    return currRunnerData.value;
  }

  private getVariableRealValue(runnerData: any, variableValue: string, datasetIdMap: Record<string, string>): string {
    const [variableName, ...propertyPath] = variableValue.split('.');
    const matchingVariable = runnerData.find((data: any) => data.variable === variableName);
    
    if (matchingVariable) {
      let value = this.getValueForVariable(matchingVariable, datasetIdMap);
      if (!value) return '';
      
      value = this.traversePropertyPath(value, propertyPath);
      return typeof value === 'object' ? JSON.stringify(value) : value;
    }
    return '';
  }

  private getValueForVariable(variable: any, datasetIdMap: Record<string, string>): any {
    if (variable.type === "dataset" && variable.value !== "") {
      const dataset = this.datasets.find((dataset) => dataset.id.toString() === variable.value);
      if (dataset) {
        const matchingDatasetIndex = parseInt(datasetIdMap[variable.value]);
        if (!isNaN(matchingDatasetIndex) && matchingDatasetIndex < dataset.data.length) {
          return dataset.data[matchingDatasetIndex];
        }
      }
      return '';
    }
    return variable.value;
  }

  private traversePropertyPath(value: any, propertyPath: string[]): any {
    if (propertyPath.length > 0 && typeof value === 'object') {
      try {
        return propertyPath.reduce((obj, prop) => obj[prop], value) || '';
      } catch (error) {
        console.error('Error accessing nested property:', error);
        return '';
      }
    }
    return value;
  }
}
