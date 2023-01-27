const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});
rl.question("Please enter numbers separated by a space to add together: ", (numbers) => {
  rl.close();
  let sum = 0;
  numbers.split(" ").forEach(number => sum += Number(number));
  console.log("SUM: " + sum);
});