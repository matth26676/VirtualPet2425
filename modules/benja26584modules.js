var petSatiated = document.getElementById("petSatiated");
var petSatiatedValue = 100;
var PetHungerIncrement = setInterval(satiationDown, 1000);

function satiationDown() {
  if (petSatiatedValue > 0) {
    petSatiatedValue--;
    petSatiated.innerHTML = petSatiatedValue;
  }
}

function feedPet() {
  petSatiated = 100;
}

module.exports = {
    petSatiated, 
    PetHungerIncrement, 
    satiationDown, 
    feedPet 
};