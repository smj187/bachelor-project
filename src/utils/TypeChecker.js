
class TypeChecker {
  static isInstanceOf(instance, clazz) {
    const objectPropertyNames = Object.getOwnPropertyNames(instance)
    const classPropertyNames = Object.getOwnPropertyNames(new clazz())
    return classPropertyNames.filter((c) => objectPropertyNames.includes(x)).length
    // return classPropertyNames.length
    //   === _.intersection(classPropertyNames, objectPropertyNames).length
  }
}

export default TypeChecker
