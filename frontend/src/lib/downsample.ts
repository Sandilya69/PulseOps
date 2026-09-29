export interface DataPoint {
  x: number;
  y: number;
  timestamp?: number | string;
  [key: string]: unknown;
}

export function lttb(data: DataPoint[], threshold: number): DataPoint[] {
  if (data.length <= threshold) return data;
  if (threshold < 2) return data.slice(0, threshold);

  const sampled: DataPoint[] = [];
  const bucketSize = (data.length - 2) / (threshold - 2);

  let a = 0;
  sampled.push(data[0]);

  for (let i = 1; i < threshold - 1; i++) {
    const start = Math.floor((i - 1) * bucketSize) + 1;
    const end = Math.floor(i * bucketSize) + 1;
    const endIdx = Math.min(end, data.length - 1);

    const avgX = data.slice(start, endIdx).reduce((sum, d) => sum + d.x, 0) / (endIdx - start);
    const avgY = data.slice(start, endIdx).reduce((sum, d) => sum + d.y, 0) / (endIdx - start);

    const nextStart = Math.floor(i * bucketSize) + 1;
    const nextEnd = Math.floor((i + 1) * bucketSize) + 1;
    const nextEndIdx = Math.min(nextEnd, data.length - 1);

    const nextAvgX = data.slice(nextStart, nextEndIdx).reduce((sum, d) => sum + d.x, 0) / (nextEndIdx - nextStart);
    const nextAvgY = data.slice(nextStart, nextEndIdx).reduce((sum, d) => sum + d.y, 0) / (nextEndIdx - nextStart);

    const pointA = data[a];
    const pointB = { x: avgX, y: avgY };
    const pointC = { x: nextAvgX, y: nextAvgY };

    const area = Math.abs(
      (pointA.x - pointC.x) * (pointB.y - pointA.y) -
      (pointA.x - pointB.x) * (pointC.y - pointA.y)
    ) * 0.5;

    let maxArea = -1;
    let maxAreaPoint = data[start];
    let maxAreaIndex = start;

    for (let j = start; j < endIdx; j++) {
      const point = data[j];
      const pointArea = Math.abs(
        (pointA.x - pointC.x) * (point.y - pointA.y) -
        (pointA.x - point.x) * (pointC.y - pointA.y)
      ) * 0.5;

      if (pointArea > maxArea) {
        maxArea = pointArea;
        maxAreaPoint = point;
        maxAreaIndex = j;
      }
    }

    sampled.push(maxAreaPoint);
    a = maxAreaIndex;
  }

  sampled.push(data[data.length - 1]);
  return sampled;
}

export function lttbWithTimestamp(data: DataPoint[], threshold: number): DataPoint[] {
  const withNumericX = data.map((d, i) => ({
    ...d,
    x: d.timestamp ? new Date(d.timestamp).getTime() : i,
  }));
  
  const sampled = lttb(withNumericX, threshold);
  
  return sampled.map(d => {
    const { x: _, ...rest } = d;
    return rest as DataPoint;
  });
}

export function downsample(data: DataPoint[], threshold: number): DataPoint[] {
  return lttb(data, threshold);
}

export function minMaxDownsample(data: DataPoint[], threshold: number): DataPoint[] {
  if (data.length <= threshold) return data;
  
  const bucketSize = Math.ceil(data.length / threshold);
  const result: DataPoint[] = [];
  
  for (let i = 0; i < data.length; i += bucketSize) {
    const bucket = data.slice(i, i + bucketSize);
    if (bucket.length === 0) continue;
    
    const min = bucket.reduce((min, d) => d.y < min.y ? d : min, bucket[0]);
    const max = bucket.reduce((max, d) => d.y > max.y ? d : max, bucket[0]);
    
    result.push(min);
    if (max !== min) result.push(max);
  }
  
  return result.slice(0, threshold);
}

export function averageDownsample(data: DataPoint[], threshold: number): DataPoint[] {
  if (data.length <= threshold) return data;
  
  const bucketSize = Math.ceil(data.length / threshold);
  const result: DataPoint[] = [];
  
  for (let i = 0; i < data.length; i += bucketSize) {
    const bucket = data.slice(i, i + bucketSize);
    if (bucket.length === 0) continue;
    
    const avgX = bucket.reduce((sum, d) => sum + d.x, 0) / bucket.length;
    const avgY = bucket.reduce((sum, d) => sum + d.y, 0) / bucket.length;
    
    result.push({ x: avgX, y: avgY });
  }
  
  return result;
}

export function adaptiveDownsample(data: DataPoint[], threshold: number): DataPoint[] {
  if (data.length <= threshold) return data;
  
  const variance = calculateVariance(data);
  
  if (variance < 0.01) {
    return averageDownsample(data, threshold);
  }
  
  return lttb(data, threshold);
}

function calculateVariance(data: DataPoint[]): number {
  const mean = data.reduce((sum, d) => sum + d.y, 0) / data.length;
  const variance = data.reduce((sum, d) => sum + Math.pow(d.y - mean, 2), 0) / data.length;
  return variance / (mean * mean + 1e-10);
}

export function timeBucketDownsample(
  data: DataPoint[], 
  threshold: number,
  timeField: keyof DataPoint = 'timestamp'
): DataPoint[] {
  if (data.length <= threshold) return data;
  
  const timestamps = data.map(d => d[timeField] ? new Date(d[timeField] as string | number).getTime() : 0);
  const minTime = Math.min(...timestamps);
  const maxTime = Math.max(...timestamps);
  const timeRange = maxTime - minTime;
  
  if (timeRange === 0) return averageDownsample(data, threshold);
  
  const bucketDuration = timeRange / threshold;
  const buckets = new Map<number, DataPoint[]>();
  
  data.forEach((d, i) => {
    const time = timestamps[i];
    const bucketIndex = Math.floor((time - minTime) / bucketDuration);
    const bucket = Math.min(bucketIndex, threshold - 1);
    
    if (!buckets.has(bucket)) {
      buckets.set(bucket, []);
    }
    buckets.get(bucket)!.push(d);
  });
  
  const result: DataPoint[] = [];
  for (let i = 0; i < threshold; i++) {
    const bucket = buckets.get(i);
    if (bucket && bucket.length > 0) {
      const avgX = bucket.reduce((sum, d) => sum + d.x, 0) / bucket.length;
      const avgY = bucket.reduce((sum, d) => sum + d.y, 0) / bucket.length;
      result.push({ x: avgX, y: avgY });
    }
  }
  
  return result;
}

export function smartDownsample(
  data: DataPoint[], 
  threshold: number,
  options: {
    method?: 'lttb' | 'minmax' | 'average' | 'adaptive' | 'timebucket';
    timeField?: keyof DataPoint;
    preserveExtremes?: boolean;
  } = {}
): DataPoint[] {
  const { method = 'adaptive', timeField = 'timestamp', preserveExtremes = true } = options;
  
  if (data.length <= threshold) return data;
  
  let result: DataPoint[];
  
  switch (method) {
    case 'lttb':
      result = lttb(data, threshold);
      break;
    case 'minmax':
      result = minMaxDownsample(data, threshold);
      break;
    case 'average':
      result = averageDownsample(data, threshold);
      break;
    case 'timebucket':
      result = timeBucketDownsample(data, threshold, timeField);
      break;
    case 'adaptive':
    default:
      result = adaptiveDownsample(data, threshold);
      break;
  }
  
  if (preserveExtremes) {
    const first = data[0];
    const last = data[data.length - 1];
    const min = data.reduce((min, d) => d.y < min.y ? d : min, data[0]);
    const max = data.reduce((max, d) => d.y > max.y ? d : max, data[0]);
    
    const extremes = [first, last, min, max].filter((d, i, arr) => 
      arr.findIndex(e => e.x === d.x && e.y === d.y) === i
    );
    
    const existingX = new Set(result.map(d => d.x));
    extremes.forEach(d => {
      if (!existingX.has(d.x)) {
        result.push(d);
      }
    });
    
    result.sort((a, b) => a.x - b.x);
  }
  
  return result.slice(0, threshold);
}