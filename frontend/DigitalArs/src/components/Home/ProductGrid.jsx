import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'

import ProductCard from './ProductCard'

function ProductGrid({ products }) {
  return (
    <Box
      sx={{
        flexGrow: 1,
        p: {
          xs: 2,
          sm: 3,
          md: 4
        }
      }}
    >
      <Grid
        container
        spacing={{
          xs: 2,
          md: 3
        }}
        columns={{
          xs: 4,
          sm: 8,
          md: 12
        }}
      >
        {products.map(product => (
          <Grid
            key={product.id}
            size={{
              xs: 4,
              sm: 4,
              md: 4
            }}
            sx={{
              display: 'flex'
            }}
          >
            <ProductCard product={product} />
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}

export default ProductGrid
