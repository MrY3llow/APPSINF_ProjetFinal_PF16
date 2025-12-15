function filterWords(input) {
  const text1=input.toLowerCase(); // Transforme en minuscules
  
  // Liste de correspondance des accents (dans la langue française)
  const accentList = {
    'à': 'a', 'â': 'a', 'ä': 'a',
    'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e',
    'î': 'i', 'ï': 'i',
    'ô': 'o', 'ö': 'o',
    'ù': 'u', 'û': 'u', 'ü': 'u',
    'ç': 'c'
  };
  
  // Liste de caractères qu'on veut remplacer par un espace
  const spaceList = {
    '\t':' ', '\n':' ', '\r':' ', '-':' ', "'":' '
  };

  // Liste de mots vides considérés inutiles (on peut l'étendre par la suite)
  const stopWords = new Set([
    'un', 'une', 'des', 'le', 'la', 'les', 'l', 'du', 'de', 'a', 'et', 'ou', 'mais', 'donc', 'car',
    'que', 'qui', 'quoi', 'qu', 'dont', 'ou', 'quand', 'comment', 'pourquoi',
    'dans', 'en', 'sur', 'sous', 'chez', 'par', 'pour', 'avec', 'sans', 'vers', 'entre',
    'mon', 'ton', 'son', 'notre', 'votre', 'leur', 'mes', 'tes', 'ses', 'mon', 'ma', 'mes',
    'ce', 'cet', 'cette', 'ces', 'ca', 'cela', 'ici', 'la',
    'il', 'elle', 'ils', 'elles', 'on', 'y', 'si', 'ne', 'pas', 'plus', 'moins',
    'ai', 'as', 'avons', 'avez', 'ont', 'ete', 'etait', 'avoir', 'avais',
    'me', 'te', 'se', 'nous', 'vous', 'lui', 'moi', 'toi', 'soi', 'je', 'j', 'tu', 'nous', 'vous'
  ]);

  let text2=""; 
  
  for (let i=0; i<text1.length; i+=1) {
    let char=text1[i];
    
    if (accentList[char]) { 
      char = accentList[char]; // Remplace les lettres accentuées par leur équivalent sans accent
    }

    if (spaceList[char]) { 
      char = spaceList[char]; // remplace certains caractères par un espace
    }
    
    const isLetter=(char>='a' && char<='z'); // Vérifie si c'est une lettre minuscule
    const isNumber=(char>='0' && char<='9'); // Vérifie si c'est un chiffre
    const isSpace=(char==' '); // Vérifie si c'est un espace
    if (isLetter || isNumber || isSpace) {
      text2+=char; // Ajoute le caractère valide à la chaîne nettoyée
    } 
  }
  
  const text3=text2.trim().split(' ').filter(word => word.length > 0); // Créer une liste de mots, sans les espaces du début et fin de chaîne, en supprimant les mots vides

  const wordList = text3.filter(word => !stopWords.has(word)); // Supprime les mots vides de la liste

  return wordList;
}


// Calcule la distance de levenshtein entre 2 strings
function levenshtein(a, b) {
  // si les 2 strings sont les mêmes
  if (a==b) {
    return 0;
  }
  
  let la=a.length;
  let lb = b.length;
  
  // si un des strings est vide
  if (la==0) {
    return lb;
  }
  if (lb==0) {
      return la;
  }
  
  if (la>lb) { 
    const tmp=a;
    a=b; 
    b=tmp; 
    la=a.length; 
    lb=b.length; 
  }
  let prev=new Array(la+1);
  
  for (let i=0; i<=la; i+=1) {
    prev[i]=i;
  }
  
  for (let j=1; j<=lb; j+=1) {
    let cur=[j];
    const bj=b.charAt(j-1);
    
    for (let i=1; i<=la; i+=1) {
      const cost=a.charAt(i-1) === bj ? 0:1;
      const insertion=cur[i-1]+1;
      const deletion=prev[i]+1;
      const substitution=prev[i-1]+cost;
      cur[i]=Math.min(insertion, deletion, substitution);
    }
    prev=cur;
  }
  return prev[la];
}


// renvoie une valeur de similarité de 2 strings entre 0 et 1 en utilisant 
// la distance de levenshtein
function similarity(a, b) {
  if (!a || !b) {
    return 0;
  }
  
  const dist = levenshtein(a, b);
  const maxLen = Math.max(a.length, b.length);
  
  if (maxLen==0) {
    return 1;
  }
  
  return 1-(dist/maxLen);
}


/**
 * Pour une phrase d'entrée (input) et des documents (docList, une liste de string), retourne
 * les documents trier dans l'ordre de correspondance à la phase d'entrée.
 * @param {string} input - La phrase d'entrée
 * @param {Array<string>} docList - La liste de document.
 * @return {Array<string>} - Retourne la suite des documents du plus correspondant au moins correspondant
 * @exemple ```
 * input = "J'ai mangé des saucisses à la compote et maintenant j'ai mal au ventre aie !"
 * docList = [
 *     "Les saucisses de l'archiduchesse sont-elles sèches ? Archisèches !",
 *     "Ma compote de poire pue le caca boudin.",
 *     "Les compotes de pommes sont-elles une opération extraterrestre pour pourrire nos dents ?",
 * ];
 * 
 * > returns : [
 * |   "Les compotes de pommes sont-elles une opération extraterrestre pour pourrire nos dents ?",
 * |   "Ma compote de poire pue le caca boudin.",
 * |   "Les saucisses de l'archiduchesse sont-elles sèches ? Archisèches !"
 *];
 * ```
 */
function documentSort(input, docList) {
  // transforme les strings en listes de mots sans la ponctuation, accents et mots vides
  const inputFiltered=filterWords(input);
  const docFiltered=[];
  const weightList=[];

  for (let i=0; i<docList.length; i+=1) {
    docFiltered.push(filterWords(docList[i]))
    weightList.push(0)
  }


  for (let i=0; i<inputFiltered.length; i+=1) {
    const countList=[0,[]];
    
    // passe une première fois dans docFiltered pour faire le compte total 
    // d'un certain mot ou d'un mot suffisament proche dans les docs
    // on en profite pour compter le nombre d'occurence de chaque document dans une liste
    for (let j=0; j<docFiltered.length; j+=1) {
      countList[1].push(0);
      for (let k=0; k<docFiltered[j].length; k+=1) {
        // 0.8 est enfait la valeur de similarité qu'on trouve suffisante pour
        // considérer 2 mots comme simillaires ou prouches
        if (similarity(inputFiltered[i],docFiltered[j][k])>0.8) {
          countList[1][j]+=1; // le nombre d'occurence d'un mot(ou un parent) dans un doc spécifique
        }
      }
      if (countList[1][j]>0) {
        countList[0]+=1; // le nombre de doc où le mot(ou un parent) apparait
      }
    }
    
    // calcule le poids des mots
    for (let j=0; j<docFiltered.length; j+=1) {
      for (let l=0; l<docFiltered[j].length; l+=1) {
        // si les mots sont suffisament similaires, on calcule le poids
        if (similarity(inputFiltered[i],docFiltered[j][l])>0.8) {
          const x=1 + (countList[1][j] / docFiltered[j].length);
          const TF=Math.log10(x);

          const y=docFiltered.length / countList[0];
          const IDF=Math.log10(y);

          // on utilise la même formule que pour le projet préparatoire mais
          // on multiplie par la similarité(entre 0.8 et 1)
          weightList[j]+=(TF+IDF)*similarity(inputFiltered[i],docFiltered[j][l])
        }
      }
    }
  }
  // Pair docList avec la liste de poids puis trie les strings de docList dans
  // un ordre décroissant en fonction du poids
  const paired = docList.map((doc, i) => [doc, weightList[i]]);
  paired.sort((a, b) => b[1] - a[1]);
  const sortedDocs = paired.map(pair => pair[0]);
  
  return sortedDocs
}

module.exports = {
  documentSort: documentSort
}