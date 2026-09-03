//programma met synchrone functie aanroep

function print(naam: string, leeftijd: number) {
    console.log(`Hallo ${naam}. U bent ${leeftijd}`);
}

export function run(){
    let intervalId = setInterval(() => {
        print("Jan", 22)
    }, 1000);
    
    setTimeout(() => {
        clearInterval(intervalId);
    }, 20_000);
}
