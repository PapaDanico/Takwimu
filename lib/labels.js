// Reader labels for data keys (owner decision U7): "completed-independently-verified" -> "Completed, independently verified".
export const stateLabel = (k) => String(k).replace(/-independently-/, ', independently ').replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase());
