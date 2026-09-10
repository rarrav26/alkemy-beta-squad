import { ElementosGlobales } from '../../context/ElementosGlobales'
import { useContext } from 'react'

import Box from '@mui/material/Box'
import LinearProgress from '@mui/material/LinearProgress'
import Typography from '@mui/material/Typography'

import ProductGrid from './ProductGrid'

function ProductList() {
  const { products, error, loading, search } = useContext(ElementosGlobales)

  const filteredProducts = products.filter(product =>
    product.title.toLowerCase().includes(search.toLowerCase())
  )
  {
    loading ? <p> cargando</p> : <p>termino de cargar</p>
  }
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '90vh',
          width: '100%'
        }}
      >
        <LinearProgress sx={{ width: '80%' }} />
      </Box>
    )
  }

  if (error) {
    return (
      <Typography
        color='error'
        sx={{
          textAlign: 'center',
          mt: 4
        }}
      >
        Un error ha ocurrido cargando los productos
      </Typography>
    )
  }

  return (
    <section>
      <ProductGrid products={filteredProducts} />
    </section>
  )
}

export default ProductList
