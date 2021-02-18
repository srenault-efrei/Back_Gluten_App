import { Router, Request, Response } from 'express'
import _, { isEmpty } from 'lodash'
import bcrypt from 'bcryptjs'
import { error, success } from '../../../core/helpers/response'
import { BAD_REQUEST, CREATED, OK } from '../../../core/constants/api'
import User from '../../../core/db/models/User'
import Product from '../../../core/db/models/Product'
import UsersProducts from '../../../core/db/models/UsersProducts'
import { getRepository } from 'typeorm'
import fetch from 'node-fetch'
import { getProductInfoFromOpenFoodFact, setNewProduct, ProductInterface } from '@/core/helpers/users'

const api = Router()

api.get('/:uuid', async (req: Request, res: Response) => {
  try {
    const { uuid } = req.params

    const user: User | undefined = await User.findOne(uuid)
    res.status(CREATED.status).json(success(user))
  } catch (err) {
    res.status(BAD_REQUEST.status).json(error(BAD_REQUEST, err))
  }
})

api.put('/:uuid/', async (req: Request, res: Response) => {
  const fields: string[] = []
  try {
    const { uuid } = req.params

    const missings: string[] = fields.filter((field: string) => !req.body[field])
    if (!isEmpty(missings)) {
      const isPlural = missings.length > 1
      throw new Error(`Field${isPlural ? 's' : ''} [ ${missings.join(', ')} ] ${isPlural ? 'are' : 'is'} missing`)
    }

    const { firstname, lastname, email, phone, glutenLevel, password } = req.body
    const user: User | undefined = await User.findOne(uuid)

    if (user) {
      password ? (user.password = bcrypt.hashSync(password, User.SALT_ROUND)) : ''
      firstname ? (user.firstname = firstname) : user.firstname,
        email ? (user.email = email) : user.email,
        lastname ? (user.lastname = lastname) : user.lastname
      phone ? (user.phone = phone) : user.phone
      glutenLevel ? (user.glutenLevel = glutenLevel) : user.glutenLevel

      await user.save()
      res.status(OK.status).json(success(user))
    } else {
      res.status(BAD_REQUEST.status).json({ err: 'user inexistant' })
    }
  } catch (err) {
    res.status(BAD_REQUEST.status).json(error(BAD_REQUEST, err))
  }
})

api.delete('/:uuid', async (req: Request, res: Response) => {
  try {
    const { uuid } = req.params
    const user: User | undefined = await User.findOne(uuid)
    user?.remove()
    res.status(OK.status).json(success(user))
  } catch (err) {
    res.status(BAD_REQUEST.status).json(error(BAD_REQUEST, err))
  }
})

// PRODUCT //////////

api.get('/:uuid/product/:barcode', async (req: Request, res: Response) => {
  try {
    const { uuid, barcode } = req.params

    const user: User | undefined = await User.findOne(uuid)

    if (user) {
      let product: Product | undefined = await Product.findOne(barcode)

      if (!product) {
        // If product does not exist (create it)
        const response = await fetch(`${process.env.OPENFOODFACT_API_URL}/${barcode}`)
        const data = await response.json()

        if (data.status) {
          // If product exist on OpenFoodFact (adding on DB)
          const productInterface: ProductInterface = getProductInfoFromOpenFoodFact(data)

          const newProduct = setNewProduct(productInterface)
          await newProduct.save()
          product = newProduct
        } else {
          // If product does not exist on OpenFoodFact
          res.status(BAD_REQUEST.status).json({ err: 'Product does not exist' })
        }
      }
      // Check if usersProduct of currents product and user exist / creat if it does not exist
      const usersProduct: UsersProducts | undefined = await getRepository(UsersProducts)
        .createQueryBuilder('usersProducts')
        .where('usersProducts.userId = :uuid', { uuid })
        .andWhere('usersProducts.barcode = :barcode', { barcode })
        .getOne()

      if (!usersProduct) {
        // If userProduct does not exist (create it)
        const newUsersProducts = new UsersProducts()

        newUsersProducts.barcode = barcode
        newUsersProducts.userId = uuid

        await newUsersProducts.save()
      }

      const usersProductsJoinProduct: UsersProducts | undefined = await getRepository(UsersProducts)
        .createQueryBuilder('up')
        .leftJoinAndSelect('up.product', 'product')
        .where('up.userId = :uuid', { uuid })
        .andWhere('up.barcode = :barcode ', { barcode })
        .getOne()
        
      res.status(CREATED.status).json(success(usersProductsJoinProduct))
    } else {
      res.status(BAD_REQUEST.status).json({ err: 'User does not exist' })
    }
  } catch (err) {
    res.status(BAD_REQUEST.status).json(error(BAD_REQUEST, err))
  }
})

api.get('/:uuid/users_products', async (req: Request, res: Response) => {
  const { uuid } = req.params
  try {
    const user: User | undefined = await User.findOne(uuid)
    if (user) {
      const usersProducts: UsersProducts[] | undefined = await getRepository(UsersProducts)
        .createQueryBuilder('up')
        .leftJoinAndSelect('up.product', 'product')
        .where('up.userId = :uuid', { uuid })
        .getMany()

      res.status(CREATED.status).json(success(usersProducts))
    }
  } catch (err) {
    res.status(BAD_REQUEST.status).json(error(BAD_REQUEST, err))
  }
})

api.put('/:uuid/users_products/:barcode', async (req: Request, res: Response) => {
  const { isFavorite } = req.body
  const { uuid, barcode } = req.params
  try {
    const users_products = await getRepository(UsersProducts)
      .createQueryBuilder('up')
      .leftJoinAndSelect('up.user', 'user')
      .leftJoinAndSelect('up.product', 'product')
      .where('up.userId = :uuid', { uuid })
      .andWhere('up.barcode = :barcode ', { barcode })
      .getOne()

    if (users_products) {
      users_products.isFavorite = isFavorite
      await users_products.save()
      res.status(CREATED.status).json(success(users_products))
    } else {
      res.status(BAD_REQUEST.status).json({ err: 'users_products not exist' })
    }
  } catch (err) {
    res.status(BAD_REQUEST.status).json(error(BAD_REQUEST, err))
  }
})

api.delete('/:uuid/users_products/:barcode', async (req: Request, res: Response) => {
  const { uuid, barcode } = req.params
  try {
    const users_products = await getRepository(UsersProducts)
      .createQueryBuilder('up')
      .leftJoinAndSelect('up.user', 'user')
      .leftJoinAndSelect('up.product', 'product')
      .where('up.userId = :uuid', { uuid })
      .andWhere('up.barcode = :barcode ', { barcode })
      .getOne()

    if (users_products) {
      users_products.remove()
      await users_products.save()
      res.status(CREATED.status).json(success(users_products))
    } else {
      res.status(BAD_REQUEST.status).json({ err: 'users_products not exist' })
    }
  } catch (err) {
    res.status(BAD_REQUEST.status).json(error(BAD_REQUEST, err))
  }
})

export default api
