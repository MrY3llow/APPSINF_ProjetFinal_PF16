/**
 * Compte le nombre d'occurence de chaque mots dans un string.
 * 
 * @param {string} text - Chaîne de mots à analyser
 * @return {Array} Un tableau contenant :
 *  - [0] {Object} Un dictionnaire avec les mots en clés et leur nombre d'occurence en valeurs
 *  - [1] {number} Le nombre total de mots dans le texte
 * 
 * @exemple ```
 * const result = countWords("Bonjour! Bonjour le monde");
 * > result[0] = {"bonjour": 2, "le": 1, "monde": 1}
 * > result[1] = 4
 * ``` 
 * 
 * @description
 * Détails:
 * - les majuscules sont ignorée
 * - ne tiens pas compte des caractères spéciaux
 * - Les mots dans le dictionnaire sont ajouté selon l'ordre des mots dans le input.
 */
function countWords(input) {
  const text1=input.toLowerCase(); // Transforme en minuscules
  const text2=text1.replace(/[^\p{L}\p{N}\s]/gu, ""); // Supprime tous ce qui n'est pas une lettre, un chiffre ou un espace
  const text3=text2.trim().split(/\s+/); // Créer une liste de mots, sans les espaces du début et fin de chaîne, en découpant un ou plusieurs espaces consécutifs (espaces, tabulations, sauts de lignes, etc)

  const words_count = {};

  for (let i=0; i<text3.length; i+=1) {
    if (words_count[text3[i]]) {
      words_count[text3[i]]+=1;
    }
    else {
      words_count[text3[i]]=1;
    }
  }
  return [words_count,text3.length];
}

/**
 * Pour une phrase d'entrée (input) et des documents (doc_list, une suite de string), retourne
 * les documents trier dans l'ordre de correspondance à la phase d'entrée.
 * @param {string} input - La phrase d'entrée
 * @param {Array<string>} doc_list - La suite de document en string.
 * @return {Array<string>} - Retourne la suite des documents du plus correspondant au moins correspondant
 * @exemple ```
 * input = "J'ai mangé des pâtes au jambon, j'ai mal au ventre parce que les pâtes sont empoisonnées.";
 * doc_list = [
 *     "J'ai vu quelqu'un faire des pâtes empoisonées qui font mal au ventre.",
 *     "J'ai perdu mon chien.",
 *     "J'ai mangé une pizza au jambon.",
 * ];
 * 
 * > doc_list : [
 * |   "J'ai vu quelqu'un faire des pâtes empoisonées qui font mal au ventre.",
 * |   "J'ai mangé une pizza au jambon.",
 * |   "J'ai perdu mon chien."]
 * ```
 */
function documentSearch(input, doc_list) {
  const wheight_list=[]; // Liste des poids
  const doc_list_count=[];
  
  const input_count=countWords(input)[0]; // Contient le nombre d'occurence de chaque mots

  for (let l=0; l<doc_list.length; l+=1) {
    doc_list_count.push(countWords(doc_list[l]));
    wheight_list.push(0);
  }
  
  for (const word in input_count) {
    let count=0;
    
    // compte dans combien de document le mot apparait
    for (let i=0; i<doc_list.length; i+=1) {
      if (doc_list_count[i][0][word]) {
        count+=1
      }
    }

    for (let j=0; j<doc_list.length; j+=1) {
      if (doc_list_count[j][0][word]) {
        const x=1 + (doc_list_count[j][0][word] / doc_list_count[j][1]);
        const TF=Math.log10(x);

        const y=doc_list_count.length / count;
        const IDF=Math.log10(y)

        // ajoute le poid du mot au poid total du document
        wheight_list[j]+=TF+IDF
      }
    }
  }
  // associe chaque document à son poid et trie en fonction du poid
  let paired=doc_list.map((str, m) => [str, wheight_list[m]]);
  paired.sort((a, b) => b[1]-a[1]);
  let sorted_docs=paired.map((pair) => pair[0]);
  
  return sorted_docs;
}

module.exports = {
  documentSearch: documentSearch
}