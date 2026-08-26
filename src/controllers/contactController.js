const contactService = require('../services/contactService');

function list(req, res, next) {
  try {
    const { page, limit, search, favorite, groupId, letter, sortBy, sortOrder } = req.query;
    const result = contactService.listContacts(req.user.id, {
      page, limit, search, favorite, groupId, letter, sortBy, sortOrder,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

function getById(req, res, next) {
  try {
    const contact = contactService.getContactById(req.user.id, req.params.id);
    if (!contact) {
      return res.status(404).json({ error: 'NotFound', message: 'Contacto no encontrado' });
    }
    res.json(contact);
  } catch (err) {
    next(err);
  }
}

function create(req, res, next) {
  try {
    const contact = contactService.createContact(req.user.id, req.body);
    res.status(201).json(contact);
  } catch (err) {
    next(err);
  }
}

function update(req, res, next) {
  try {
    const contact = contactService.updateContact(req.user.id, req.params.id, req.body);
    if (!contact) {
      return res.status(404).json({ error: 'NotFound', message: 'Contacto no encontrado' });
    }
    res.json(contact);
  } catch (err) {
    next(err);
  }
}

function remove(req, res, next) {
  try {
    const deleted = contactService.deleteContact(req.user.id, req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'NotFound', message: 'Contacto no encontrado' });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

function toggleFavorite(req, res, next) {
  try {
    const contact = contactService.toggleFavorite(req.user.id, req.params.id);
    if (!contact) {
      return res.status(404).json({ error: 'NotFound', message: 'Contacto no encontrado' });
    }
    res.json(contact);
  } catch (err) {
    next(err);
  }
}

function favorites(req, res, next) {
  try {
    const { page, limit } = req.query;
    const result = contactService.listContacts(req.user.id, {
      page, limit, favorite: true,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

function byLetter(req, res, next) {
  try {
    const index = contactService.getContactsByLetter(req.user.id);
    res.json({ data: index });
  } catch (err) {
    next(err);
  }
}

function recent(req, res, next) {
  try {
    const limit = req.query.limit || 10;
    const contacts = contactService.getRecentContacts(req.user.id, limit);
    res.json({ data: contacts });
  } catch (err) {
    next(err);
  }
}

function sync(req, res, next) {
  try {
    const since = req.query.since;
    if (!since) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'El parámetro "since" es requerido (ISO 8601)',
      });
    }
    const result = contactService.getChangesSince(req.user.id, since);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  list,
  getById,
  create,
  update,
  remove,
  toggleFavorite,
  favorites,
  byLetter,
  recent,
  sync,
};
