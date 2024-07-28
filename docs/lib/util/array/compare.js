// 配列の要素が一致するか比較する（順序も同一であること）
Array.prototype.compare = function(b) { return Array.isArray(b) && this.length === b.length && this.every((v,i) =>v===b[i]); }
//Array.prototype.compare = function(b) { return Array.isArray(b) && this.toString() === b.toString(); }
//Array.prototype.compare = function(b) { return [this,b].every(v=>Array.isArray(v)) && this.toString() === b.toString(); }
//Set.prototype.compare = function(b) { return (b instanceof Set) && this.toString() === b.toString(); }
Set.prototype.compare = function(b) { return (b instanceof Set) && this.size === b.size && [...this].every(v=>b.has(v)) }
Map.prototype.compare = function(b) { return (b instanceof Map) && this.size === b.size && [...this.keys()].every(k=>b.has(k) && b.get(k)===this.get(k)) }

