import { NativeModules, Platform, AsyncStorage } from "react-native";
import { checkUserPurchasedSettings } from "../reducers/game.utilities";
const { OS } = Platform;

AsyncStorage.removeItem("extra_2_5_seconds_per_level"); // for testing

// ios specific
const { InAppUtils } = NativeModules;

// android specific
import InAppBilling from "react-native-billing";

class Product {
  requestItemsIOS(product) {
    return new Promise((resolve, reject) => {
      InAppUtils.loadProducts([], (err, res) => {
        (err ? () => reject(err) : () => resolve(res))();
      });
    });
  }

  purchaseIOS(productId) {
    return new Promise(async (resolve, reject) => {
      InAppUtils.loadProducts([productId], (err, products) => {
        console.log("err", err);
        console.log("products", products);
        if (err) {
          reject(err);
        } else {
          InAppUtils.purchaseProduct(productId, (err, response) => {
            console.log("product id", productId);
            console.log("err", err);
            console.log("response", response);
            if (err) {
              reject(err);
            } else {
              resolve(response);
            }
          });
        }
      });
    });
  }

  purchaseAndroid(productId) {
    return new Promise(async (resolve, reject) => {
      await InAppBilling.close();
      try {
        await InAppBilling.open();
        if (!await InAppBilling.isPurchased(productId)) {
          const details = await InAppBilling.purchase(productId);
          console.log("You purchased: ", details);
        }
        const transactionStatus = await InAppBilling.getPurchaseTransactionDetails(
          productId
        );
        console.log("Transaction Status", transactionStatus);
        const productDetails = await InAppBilling.getProductDetails(productId);
        console.log(productDetails);
      } catch (err) {
        reject(err);
      } finally {
        await InAppBilling.consumePurchase(productId);
        await InAppBilling.close();
        resolve();
      }
    });
  }

  purchaseCustomActions(type) {
    switch (type) {
      case "ADD_2_5_TO_INITIAL_GAME_TIM": {
        checkUserPurchasedSettings();
      }
      default: {
        break;
      }
    }
  }

  purchase(product) {
    const productId = product.id[OS];
    return new Promise(async (resolve, reject) => {
      try {
        const purchaseFunc = OS === "ios"
          ? this.purchaseIOS
          : this.purchaseAndroid;
        const status = await purchaseFunc(productId);
        console.log("status", status);
        // const status = true; // testing for app store
        await this.savePurchaseToStorage(product);
        this.purchaseCustomActions(product.type);
        resolve(status);
      } catch (err) {
        reject(err);
      }
    });
  }

  restore(product) {
    this.purchase(product);
  }

  savePurchaseToStorage(product) {
    return AsyncStorage.setItem(product.storageKey, JSON.stringify(product));
  }

  loadProductsFromStorage(products) {
    return new Promise(async (resolve, reject) => {
      try {
        const itemsFromStorage = await Promise.all(
          products.map(({ storageKey }) => AsyncStorage.getItem(storageKey))
        );
        resolve(itemsFromStorage.map(JSON.parse));
      } catch (err) {
        reject(err);
      }
    });
  }

  alreadyPurchased({ storageKey }) {
    return new Promise(async (resolve, reject) => {
      try {
        const status = await AsyncStorage.getItem(storageKey);
        resolve(status !== null);
      } catch (err) {
        reject(err);
      }
    });
  }
}

export { Product };
