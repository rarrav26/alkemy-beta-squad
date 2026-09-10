import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Modal from '@mui/material/Modal'
import Button from '@mui/material/Button'

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: {
    xs: '85%',
    sm: 500
  },
  bgcolor: 'background.paper',
  boxShadow: 24,
  borderRadius: 2,
  p: 4
}

function ProductDetail({ product, open, handleClose }) {
  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby='product-detail-title'
      aria-describedby='product-detail-description'
    >
      <Box sx={style}>
        <Typography
          id='product-detail-title'
          variant='h5'
          component='h2'
          gutterBottom
        >
          {product.title}
        </Typography>

        <Typography id='product-detail-description' sx={{ mb: 2 }}>
          {product.description}
        </Typography>

        <Typography sx={{ mb: 1 }}>
          <strong>Category:</strong> {product.category}
        </Typography>

        <Typography sx={{ mb: 2 }}>
          <strong>Rating:</strong> {product.rating}
        </Typography>

        <Button variant='contained' onClick={handleClose}>
          Cerrar
        </Button>
      </Box>
    </Modal>
  )
}

export default ProductDetail
