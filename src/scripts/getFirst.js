export default function getFirst (object) {
    for (var i in object) {
      return i;
    }
}
