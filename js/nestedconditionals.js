for (let num = 1; num <= 50; num++) {

  if (num % 50 === 0) {
    console.log(num + " is divisible by 50");

  } else {
    if (num % 25 === 0) {
      console.log(num + " is divisible by 25");

    } else {
      if (num % 10 === 0) {
        console.log(num + " is divisible by 10");

      } else {
        if (num % 5 === 0) {
          console.log(num + " is divisible by 5");

        } else {
          if (num % 2 === 0) {
            console.log(num + " is divisible by 2");

          } else {
            console.log(num + " is not divisible by 2, 5, 10, 25, or 50");
          }
        }
      }
    }
  }
}
