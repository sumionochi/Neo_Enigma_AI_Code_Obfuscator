function sensitiveFunction() {
  const apiKey = "secret_key_123";
  return fetch("https://api.example.com", {
    headers: { Authorization: apiKey }
  });
}

class ComplexClass {
  private data: any[];
  
  constructor() {
    this.data = [];
  }

  processData(input: number) {
    for (let i = 0; i < input; i++) {
      if (i % 2 === 0) {
        this.data.push(Math.pow(i, 2));
      } else {
        this.data.push(Math.sqrt(i));
      }
    }
    return this.data.reduce((a, b) => a + b, 0);
  }
}