// project.js - purpose and description here
// Author: Your Name
// Date:

// NOTE: This is how we might start a basic JavaaScript OOP project

// Constants - User-servicable parts
// In a longer project I like to put these in a separate file

// define a class
class MyProjectClass {
  // constructor function
  constructor(param1, param2) {
    // set properties using 'this' keyword
    this.property1 = param1;
    this.property2 = param2;
  }
  
  // define a method
  myMethod() {
    // code to run when method is called
  }
}

function main() {
  // create an instance of the class
  let myInstance = new MyProjectClass("value1", "value2");

  // call a method on the instance
  myInstance.myMethod();
}

// let's get this party started - uncomment me
main();

const fillers = {
  first: ["Harry", "Frieren ", "Gojo","炎", "David", "Lucyna "],
  last: ["Potter", "Tribbiani", "Satoru", "萧", "Martinez", "Kushinada"],
  ingredient: ["unicorn hair", "phoenix feather", "dragon scale", "moonstone dust", "fairy wings", "mermaid tears", "vampire fang", "witch's herb", "goblin eye", "mystic mushrooms", "ether blossom", "star fragments"],
  action: ["grind", "boil", "mix", "stir", "shake", "chant over", "ferment", "freeze", "infuse", "distill", "bless", "enchant"],
  container: ["cauldron", "crystal vial", "enchanted flask", "ancient urn", "magic goblet", "stone bowl", "pewter pot", "golden chalice", "silver decanter", "brass cup", "ceramic jar", "glass bottle"],
  effect: ["invisibility", "flight", "healing", "transformation", "luck enhancement", "strength boost", "mind reading", "time manipulation", "fire breathing", "teleportation", "shape shifting", "eternal youth"],
  potionName: ["Elixir of $effect", "Potion of $effect", "$effect Draught", "$effect Brew", "Mystic $effect Tonic", "$effect Essence", "Pure $effect Solution", "Ancient $effect Concoction", "Rare $effect Syrup", "Magical $effect Extract", "$effect Serum", "Enchanted $effect Mixture"],
  wizard: ["wise", "young", "ancient", "mysterious", "fabled", "powerful", "forgotten", "legendary", "novice", "cunning", "kind-hearted", "fierce"],
  place: ["hidden valley", "enchanted forest", "mystical mountain", "secret island", "ancient ruins", "forbidden cave", "distant land", "old library", "wizard's tower", "royal court", "shadowy realm", "celestial domain"],
};

const template = `Originally created by a $wizard wizard named $first $last, the $potionName has been sought after by many for its remarkable abilities.

Brewing Instructions:
1. Begin in a location known for its magical properties, such as $place.
2. Carefully select your primary ingredients: $ingredient and $ingredient. These form the base of your potion and dictate its primary effects.
3. In a $container, carefully $action the primary ingredients to initiate the magical reaction. Ensure the environment is calm and your focus unwavering.
4. As the potion starts to manifest its magic, $action it gently to maintain its potency. At this crucial juncture, add a pinch of $ingredient to enhance the desired effect.
5. Continue to $action the mixture until it fully transforms, indicating with a distinctive aroma that the potion is ready.`;


// STUDENTS: You don't need to edit code below this line.

const slotPattern = /\$(\w+)/;

function replacer(match, name) {
  let options = fillers[name];
  if (options) {
    return options[Math.floor(Math.random() * options.length)];
  } else {
    return `<UNKNOWN:${name}>`;
  }
}

function generate() {
  let story = template;
  while (story.match(slotPattern)) {
    story = story.replace(slotPattern, replacer);
  }

  /* global box */
  $("#box").text(story);
}

/* global clicker */
$("#clicker").click(generate);

generate();
