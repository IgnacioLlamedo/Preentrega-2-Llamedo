import { randomUUID } from "crypto"
import { dbCarts } from "./models/CartMongoose.js"
import { pm } from "./ProductManager.js"

class CartManager {

    async createCart() {
        const cart = await dbCarts.create({ _id: randomUUID(), products: [] })
        return cart.toObject()
    }

    async findAll() {
        return await dbCarts.find().lean()
    }

    async findById(id) {
        const search = await dbCarts.findById(id).lean()
        if(!search) {
            throw new Error('Cart Not Found')
        }
        return search
    }

    async findProduct(cartId, productId) {
        const cart = await dbCarts.findById(cartId).lean()
        const product = cart.products.find(p => p.productID === productId)
        return product
    }

    async populate(id) {
        return await dbCarts.findById(id).populate('product.productId').lean()
    }

    async deleteCart(id) {
        const deleted = await dbCarts.findByIdAndDelete(id).lean()
        if(!deleted){
            throw new Error('Cart Not Found')
        }
        return deleted
    }

    async addToCart(cartId, productId) {
        try{
            const cart = await dbCarts.findById(cartId)
            if(cart) {
                pm.findById(productId)
                const productInCart = cart.products.find(p => p.productID === productId)
                if (!productInCart) {
                    await dbCarts.findByIdAndUpdate(cartId, { $push: { products: { productID: productId, quantity: 1 } } }, { new: true })
                }
                else {
                    const updatedCart = await dbCarts.findOneAndUpdate({ _id: cartId, 'products.productID': productId }, { $inc: { 'products.$.quantity': 1 } }, { new: true })
                    return updatedCart
                }
            }
            else {
                throw new Error ('Cart NOT found')
            }
        }
        catch (error) {
            res.json({
                status: "error",
                message: error.message
            }) 
        }
    }

    async deleteFromCart(cartId, productId) {
        const cart = await dbCarts.findById(cartId).lean()
        if(cart) {
            const product = cart.products.find(p=> p.productID === productId)
            if(product) {
                await dbCarts.findByIdAndUpdate(cartId, { $pull: { products: { productID: productId } } }, { new: true }).lean()
            }
            else {
                throw new Error('Product Not Found')
            }
        }
        else {
            throw new Error('Cart Not Found')
        }
    }

    async updateCart(id, newData) {
        const updatedCart = await dbCarts.findByIdAndUpdate(id, { $set: { products: newData } }, { $new: true }).lean()
        if(!updatedCart) {
            throw new Error('Cart Not Found')
        }
        return updatedCart
    }

    async updateQuantity(cartId, productId, quantity) {
        const updated = await dbCarts.findByIdAndUpdate(cartId, { $set: { products: { productID: productId, quantity } } }, { $new: true })
        if(!updated) {
            throw new Error('Cart or Product Not Found')
        }
        return updated
    }
}


export const cm = new CartManager()
